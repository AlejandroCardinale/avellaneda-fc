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
const express    = require('express');
const bcrypt     = require('bcrypt');
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');        // Nativo de Node.js, no requiere instalación
const nodemailer = require('nodemailer');
const pool       = require('../db');
const router     = express.Router();


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
    rol:     usuario.rol,
    nombre:  usuario.nombre
  };
  const access_token  = jwt.sign(payload, JWT_SECRET,         { expiresIn: JWT_EXPIRES_IN });
  const refresh_token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });
  return { access_token, refresh_token };
}

// ─── Nodemailer transporter ─────────────────────────────────────────────────
/**
 * Configura el cliente de email usando variables del .env.
 * Para Gmail: activar "Contraseñas de aplicación" en myaccount.google.com
 */
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  requireTLS: true,   // Necesario para Outlook/Hotmail
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { ciphers: 'SSLv3' }
});


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
  const { nombre, apellido, email, password, telefono, rol } = req.body;

  // Validaciones básicas de entrada
  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ message: 'Nombre, apellido, email y contraseña son obligatorios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  // Validar que el rol sea válido
  const rolesPermitidos = ['atleta', 'entrenador', 'administrador'];
  const rolElegido = rolesPermitidos.includes(rol) ? rol : 'atleta';

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

    // Buscar el id del rol elegido en la tabla roles
    const [roles] = await pool.execute(
      'SELECT id FROM roles WHERE nombre = ? LIMIT 1',
      [rolElegido]
    );
    const rol_id = roles[0]?.id ?? 3; // Fallback al id 3 (atleta)

    // Insertar el nuevo usuario en la BD — activo=FALSE hasta que el admin apruebe
    const [result] = await pool.execute(
      `INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono, activo, estado_registro)
       VALUES (?, ?, ?, ?, ?, ?, FALSE, 'pendiente')`,
      [rol_id, nombre.trim(), apellido.trim(), email.toLowerCase().trim(), password_hash, telefono ?? null]
    );

    // No iniciamos sesión automáticamente — el admin debe aprobar primero
    return res.status(201).json({
      message: 'Tu solicitud fue enviada. El administrador revisará tu cuenta y recibirás acceso cuando sea aprobada.',
      pendiente: true
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

    if (!usuario.activo && usuario.estado_registro === 'pendiente') {
      return res.status(403).json({ message: 'Tu cuenta está pendiente de aprobación. El administrador te habilitará el acceso a la brevedad.' });
    }

    if (!usuario.activo && usuario.estado_registro === 'rechazado') {
      return res.status(403).json({ message: 'Tu solicitud de acceso fue rechazada. Comunicate con el administrador del club.' });
    }

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

// ─── POST /api/auth/forgot-password ────────────────────────────────────────────
/**
 * Genera un token de recuperación y envía un email con el link.
 *
 * Por seguridad, siempre devuelve el mismo mensaje exitoso aunque
 * el email no exista (para no revelar qué emails están registrados).
 *
 * HTTP 200: Email enviado (o email no encontrado — mismo mensaje)
 * HTTP 500: Error al enviar el email
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'El email es obligatorio.' });
  }

  try {
    // Buscar usuario (si no existe, igual respondemos OK por seguridad)
    const [rows] = await pool.execute(
      'SELECT id, nombre FROM usuarios WHERE email = ? AND activo = TRUE',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      // No revelamos si el email existe o no
      return res.json({ message: 'Si tu email está registrado, recibirás un correo en breve.' });
    }

    const usuario = rows[0];

    // Generar token seguro de 32 bytes (64 caracteres hex)
    const token = crypto.randomBytes(32).toString('hex');

    // Guardar token en BD (expira en 1 hora, reemplaza tokens anteriores del usuario)
    await pool.execute(
      'DELETE FROM password_reset_tokens WHERE usuario_id = ?',
      [usuario.id]
    );
    await pool.execute(
      `INSERT INTO password_reset_tokens (usuario_id, token, expira_en)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
      [usuario.id, token]
    );

    // Construir el link de recuperación
    const resetLink = `${process.env.FRONTEND_URL}/nueva-contrasena?token=${token}`;

    // Enviar email
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM,
      to:      email,
      subject: 'Recuperar contraseña — Avellaneda FC',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 28px;">
            <h1 style="color: #0d1b3e; font-size: 24px; margin: 0;">Avellaneda FC</h1>
          </div>
          <div style="background: white; border-radius: 10px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.07);">
            <h2 style="color: #0d1b3e; font-size: 20px; margin-top: 0;">Recuperar contraseña</h2>
            <p style="color: #475569; line-height: 1.6;">Hola <strong>${usuario.nombre}</strong>,</p>
            <p style="color: #475569; line-height: 1.6;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta.
              Hacé click en el botón para crear una nueva contraseña:
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetLink}"
                 style="background: #1e4fd8; color: white; padding: 14px 32px; border-radius: 8px;
                        text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
                Restablecer contraseña
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">
              Este link expira en <strong>1 hora</strong>.<br>
              Si no solicitaste este cambio, ignorá este email.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px;">O copía este link en tu navegador:</p>
            <p style="color: #1e4fd8; font-size: 12px; word-break: break-all;">${resetLink}</p>
          </div>
        </div>
      `
    });

    return res.json({ message: 'Si tu email está registrado, recibirás un correo en breve.' });

  } catch (err) {
    console.error('[forgot-password]', err);
    return res.status(500).json({ message: 'Error al enviar el email. Intentá más tarde.' });
  }
});

// ─── POST /api/auth/reset-password ─────────────────────────────────────────────
/**
 * Valida el token y actualiza la contraseña del usuario.
 *
 * Proceso:
 *   1. Busca el token en la BD y verifica que no esté expirado ni usado
 *   2. Hashea la nueva contraseña con bcrypt
 *   3. Actualiza el campo password_hash del usuario
 *   4. Marca el token como usado
 *
 * HTTP 200: Contraseña actualizada
 * HTTP 400: Token inválido, expirado o ya usado
 */
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token y contraseña son obligatorios.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    // Buscar el token en la BD (no expirado y no usado)
    const [rows] = await pool.execute(
      `SELECT prt.id, prt.usuario_id
       FROM password_reset_tokens prt
       WHERE prt.token = ? AND prt.usado = FALSE AND prt.expira_en > NOW()`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'El link es inválido o ya expiró. Solicitá uno nuevo.' });
    }

    const { id: tokenId, usuario_id } = rows[0];

    // Hashear la nueva contraseña
    const password_hash = await bcrypt.hash(password, 12);

    // Actualizar la contraseña del usuario
    await pool.execute(
      'UPDATE usuarios SET password_hash = ?, actualizado_en = NOW() WHERE id = ?',
      [password_hash, usuario_id]
    );

    // Marcar el token como usado (no se puede reutilizar)
    await pool.execute(
      'UPDATE password_reset_tokens SET usado = TRUE WHERE id = ?',
      [tokenId]
    );

    return res.json({ message: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.' });

  } catch (err) {
    console.error('[reset-password]', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;

