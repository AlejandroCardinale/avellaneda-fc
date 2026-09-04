/**
 * ============================================================
 * ROUTES/AUTH.JS — Endpoints de Autenticación
 * ============================================================
 * Maneja el ciclo completo de sesión de usuarios:
 *   POST /api/auth/register → Crear cuenta nueva
 *   POST /api/auth/login    → Iniciar sesión
 *   POST /api/auth/refresh  → Renovar el access_token
 *   POST /api/auth/logout   → Cerrar sesión
 *
 * SEGURIDAD:
 *   - Las contraseñas NUNCA se guardan en texto plano.
 *     Se usa bcrypt con "salt 12" (12 rondas de hashing).
 *     Esto hace que romper la contraseña por fuerza bruta sea muy costoso.
 *   - Los JWT (JSON Web Tokens) permiten autenticación sin estado:
 *     el servidor no necesita guardar sesiones en memoria.
 *   - Se usan DOS tokens:
 *     · access_token (1 hora): se envía en cada petición protegida
 *     · refresh_token (7 días): solo se usa para renovar el access_token
 * ============================================================
 */
const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const pool     = require('../db');
const router   = express.Router();

// Leer configuración JWT desde variables de entorno (.env)
const JWT_SECRET         = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN     || '1h';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// ─── Helper: generar tokens ─────────────────────────────────────────────────
/**
 * Genera el par de tokens JWT para un usuario autenticado.
 * El payload incluye solo datos básicos del usuario (sin contraseña).
 * El access_token expira en 1h; el refresh_token en 7 días.
 */
function generarTokens(usuario) {
  const payload = {
    id:      usuario.id,
    email:   usuario.email,
    rol:     usuario.rol,    // Incluir el rol permite verificar permisos sin consultar la BD
    nombre:  usuario.nombre
  };
  const access_token  = jwt.sign(payload, JWT_SECRET,         { expiresIn: JWT_EXPIRES_IN });
  const refresh_token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });
  return { access_token, refresh_token };
}

// ─── POST /api/auth/register ────────────────────────────────────────────────
/**
 * Registra un nuevo usuario en la base de datos.
 *
 * Proceso:
 *   1. Valida que lleguen todos los campos obligatorios
 *   2. Verifica que el email no esté ya registrado (UNIQUE en BD)
 *   3. Hashea la contraseña con bcrypt (salt 12)
 *   4. Busca el rol_id de 'atleta' en la tabla 'roles'
 *   5. Inserta el usuario en la tabla 'usuarios'
 *   6. Devuelve los tokens JWT + datos del usuario (como si ya iniciara sesión)
 *
 * HTTP 201: Creado exitosamente
 * HTTP 400: Datos faltantes o inválidos
 * HTTP 409: El email ya existe (Conflict)
 * HTTP 500: Error de base de datos
 */
router.post('/register', async (req, res) => {
  const { nombre, apellido, email, password, telefono } = req.body;

  // Validaciones básicas de entrada
  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ message: 'Nombre, apellido, email y contraseña son obligatorios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    // Verificar si el email ya existe en la BD
    const [existe] = await pool.execute(
      'SELECT id FROM usuarios WHERE email = ?', [email]
    );
    if (existe.length > 0) {
      return res.status(409).json({ message: 'Ya existe una cuenta con ese email.' });
    }

    /**
     * Hashear contraseña con bcrypt.
     * El "12" es el número de rondas (salt). A mayor número, más seguro pero más lento.
     * Con salt 12, hashear una contraseña tarda ~300ms: seguro para usuarios, lento para atacantes.
     */
    const password_hash = await bcrypt.hash(password, 12);

    // Buscar el id del rol 'atleta' en la tabla roles
    const [roles] = await pool.execute(
      "SELECT id FROM roles WHERE nombre = 'atleta' LIMIT 1"
    );
    const rol_id = roles[0]?.id ?? 3; // Fallback al id 3 (atleta según el SQL inicial)

    // Insertar el nuevo usuario en la BD
    const [result] = await pool.execute(
      `INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [rol_id, nombre.trim(), apellido.trim(), email.toLowerCase().trim(), password_hash, telefono ?? null]
    );

    // Obtener el usuario recién insertado (con el rol como texto, no como id)
    const [rows] = await pool.execute(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.avatar_url, r.nombre AS rol
       FROM usuarios u JOIN roles r ON r.id = u.rol_id
       WHERE u.id = ?`,
      [result.insertId]
    );

    const usuario = rows[0];
    const tokens  = generarTokens(usuario);

    // Devolver tokens + datos del usuario (el frontend los guarda en localStorage)
    return res.status(201).json({
      ...tokens,
      usuario: {
        id:         usuario.id,
        nombre:     usuario.nombre,
        apellido:   usuario.apellido,
        email:      usuario.email,
        rol:        usuario.rol,
        avatar_url: usuario.avatar_url ?? null
      }
    });

  } catch (err) {
    console.error('[register]', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ─── POST /api/auth/login ───────────────────────────────────────────────────
/**
 * Autentica un usuario con email y contraseña.
 *
 * Proceso:
 *   1. Busca el usuario por email (con JOIN a la tabla roles)
 *   2. Verifica que la cuenta esté activa (campo 'activo' en BD)
 *   3. Compara la contraseña con el hash usando bcrypt.compare()
 *   4. Actualiza el campo 'ultimo_login' en la BD
 *   5. Devuelve los tokens JWT + datos del usuario
 *
 * IMPORTANTE: Tanto "email no encontrado" como "contraseña incorrecta"
 * devuelven el mismo mensaje "Credenciales incorrectas" para no dar pistas
 * a posibles atacantes sobre qué emails están registrados.
 *
 * HTTP 200: Login exitoso
 * HTTP 401: Credenciales incorrectas
 * HTTP 403: Cuenta desactivada
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
  }

  try {
    // Buscar usuario por email, incluyendo el nombre del rol (JOIN)
    const [rows] = await pool.execute(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.password_hash, u.avatar_url, u.activo, r.nombre AS rol
       FROM usuarios u JOIN roles r ON r.id = u.rol_id
       WHERE u.email = ?`,
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      // Email no encontrado — mismo mensaje que contraseña incorrecta (por seguridad)
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    const usuario = rows[0];

    if (!usuario.activo) {
      return res.status(403).json({ message: 'Tu cuenta está desactivada. Contactá al administrador.' });
    }

    /**
     * bcrypt.compare() compara la contraseña en texto plano con el hash almacenado.
     * Internamente usa el mismo salt del hash para comparar de forma segura.
     * Devuelve true si coinciden, false si no.
     */
    const passwordOk = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    // Registrar el momento del último acceso en la BD
    await pool.execute(
      'UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?', [usuario.id]
    );

    const tokens = generarTokens(usuario);

    return res.json({
      ...tokens,
      usuario: {
        id:         usuario.id,
        nombre:     usuario.nombre,
        apellido:   usuario.apellido,
        email:      usuario.email,
        rol:        usuario.rol,
        avatar_url: usuario.avatar_url ?? null
      }
    });

  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ─── POST /api/auth/refresh ─────────────────────────────────────────────────
/**
 * Renueva el access_token usando el refresh_token.
 * El frontend lo llama automáticamente desde el AuthInterceptor
 * cuando recibe un error 401 del servidor.
 *
 * Se usa JWT_REFRESH_SECRET (diferente al secreto del access_token)
 * para que el refresh_token no pueda usarse como access_token.
 */
router.post('/refresh', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token requerido.' });

  try {
    // Verificar el refresh_token con su clave secreta propia
    const payload      = jwt.verify(token, JWT_REFRESH_SECRET);
    // Generar un nuevo access_token con los mismos datos del usuario
    const access_token = jwt.sign(
      { id: payload.id, email: payload.email, rol: payload.rol, nombre: payload.nombre },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    return res.json({ access_token });
  } catch {
    // refresh_token expirado o inválido → forzar nuevo login
    return res.status(401).json({ message: 'Refresh token inválido o expirado.' });
  }
});

// ─── POST /api/auth/logout ──────────────────────────────────────────────────
/**
 * En JWT puro (sin blacklist de tokens), el logout ocurre del lado del CLIENTE:
 * el frontend elimina los tokens del localStorage.
 * Este endpoint existe para mantener compatibilidad con el AuthService del frontend,
 * que hace POST /logout antes de limpiar el localStorage.
 * En producción se podría implementar una blacklist de tokens en Redis.
 */
router.post('/logout', (_req, res) => {
  return res.json({ message: 'Sesión cerrada correctamente.' });
});

module.exports = router;
