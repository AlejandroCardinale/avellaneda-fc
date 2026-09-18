/**
 * ============================================================
 * SERVER.JS — Servidor principal del backend
 * ============================================================
 * Este es el punto de entrada de la API REST del sistema.
 * Tecnología: Node.js + Express.js
 *
 * RESPONSABILIDADES:
 *   1. Configurar middlewares globales (CORS, JSON parser)
 *   2. Registrar todas las rutas de la API
 *   3. Verificar la conexión a MySQL al arrancar
 *   4. Escuchar peticiones en el puerto 3000
 *
 * CORS: Permite peticiones SOLO desde http://localhost:4200
 *       que es donde corre el frontend Angular.
 *
 * Para iniciar: node server.js
 * ============================================================
 */
require('dotenv').config(); // Carga variables de entorno desde el archivo .env
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const pool    = require('./db'); // Pool de conexiones MySQL reutilizables

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ───────────────────────────────────────────────────

/**
 * CORS (Cross-Origin Resource Sharing):
 * Permite que el frontend en localhost:4200 pueda hacer peticiones a esta API.
 * Sin esto, el navegador bloquea las peticiones por seguridad.
 */
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:4201',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:4201'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true
}));

/**
 * Parsea el body de las peticiones en formato JSON.
 * Necesario para leer req.body en los endpoints POST/PUT/PATCH.
 */
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Registro de rutas ──────────────────────────────────────────────────────

/**
 * Cada módulo tiene su propio archivo de rutas.
 * Express delega las peticiones al router correspondiente según el prefijo de URL.
 */
app.use('/api/auth',        require('./routes/auth'));        // Login, registro, logout, refresh
app.use('/api/admin',       require('./routes/admin'));       // Dashboard administrativo y métricas
app.use('/api/usuarios',    require('./routes/usuarios'));    // Gestión de usuarios del panel administrativo
app.use('/api/atletas',     require('./routes/atletas'));     // Alta y gestión de atletas
app.use('/api/entrenadores', require('./routes/entrenadores')); // Alta y gestión de entrenadores
app.use('/api/deportes',     require('./routes/deportes'));     // Gestión administrativa de deportes
app.use('/api/noticias',     require('./routes/noticias'));     // CRUD de noticias del panel administrativo
app.use('/api/recursos',     require('./routes/recursos'));     // Inventario de recursos deportivos
app.use('/api/reportes',     require('./routes/reportes'));     // Reportes y exportaciones administrativas
app.use('/api/catalogo',    require('./routes/catalogo'));    // Lista de ítems disponibles
app.use('/api/solicitudes', require('./routes/solicitudes')); // CRUD de solicitudes

// ── Health check ───────────────────────────────────────────────────────────
/**
 * Endpoint de verificación. Útil para saber si el servidor está respondiendo.
 * GET http://localhost:3000/api/health
 */
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// ── 404 catch-all ──────────────────────────────────────────────────────────
/** Responde 404 para cualquier ruta no definida */
app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));

// ── Arranque del servidor ──────────────────────────────────────────────────
async function start() {
  try {
    /**
     * Antes de abrir el servidor, verifica que MySQL esté disponible.
     * Si la BD no está corriendo, el proceso termina con error (process.exit(1)).
     * Esto evita que el servidor quede "corriendo" sin poder acceder a los datos.
     */
    const conn = await pool.getConnection();
    console.log('✅ Conectado a MySQL:', process.env.DB_NAME);
    conn.release(); // Devuelve la conexión al pool para reutilizarla

    app.listen(PORT, () => {
      console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
      console.log(`   Endpoints disponibles:`);
      console.log(`   POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   POST http://localhost:${PORT}/api/auth/refresh`);
      console.log(`   POST http://localhost:${PORT}/api/auth/logout`);
    });
  } catch (err) {
    console.error('❌ No se pudo conectar a MySQL:', err.message);
    console.error('   Verificá que MySQL esté corriendo y las credenciales en backend/.env sean correctas.');
    process.exit(1);
  }
}

start();
