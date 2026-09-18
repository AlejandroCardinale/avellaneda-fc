/**
 * ============================================================
 * ROUTES/SOLICITUDES-ACCESO.JS — Gestión de cuentas pendientes
 * ============================================================
 * Endpoints protegidos (solo administrador):
 *   GET    /api/solicitudes-acceso         → lista por estado
 *   PATCH  /api/solicitudes-acceso/:id/aprobar  → activa cuenta
 *   PATCH  /api/solicitudes-acceso/:id/rechazar → rechaza cuenta
 * ============================================================
 */
const express  = require('express');
const pool     = require('../db');
const authMw   = require('../middleware/auth');
const adminMw  = require('../middleware/require-admin');
const router   = express.Router();

// Todos los endpoints requieren JWT válido + rol administrador
router.use(authMw, adminMw);

// ─── GET /api/solicitudes-acceso ────────────────────────────────────────────
// Query param: ?estado=pendiente | aprobado | rechazado (default: pendiente)
router.get('/', async (req, res) => {
  const estado = req.query.estado || 'pendiente';
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono,
              r.nombre AS rol, u.activo, u.estado_registro, u.creado_en
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.estado_registro = ?
       ORDER BY u.creado_en DESC`,
      [estado]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[solicitudes-acceso GET]', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ─── GET /api/solicitudes-acceso/conteo ─────────────────────────────────────
// Devuelve el total de solicitudes pendientes (para el badge del sidebar)
router.get('/conteo', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT COUNT(*) AS total FROM usuarios WHERE estado_registro = 'pendiente'"
    );
    return res.json({ total: rows[0].total });
  } catch (err) {
    console.error('[solicitudes-acceso conteo]', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ─── PATCH /api/solicitudes-acceso/:id/aprobar ──────────────────────────────
router.patch('/:id/aprobar', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute(
      "UPDATE usuarios SET activo = TRUE, estado_registro = 'aprobado' WHERE id = ?",
      [id]
    );
    return res.json({ message: 'Cuenta aprobada correctamente.' });
  } catch (err) {
    console.error('[solicitudes-acceso aprobar]', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// ─── PATCH /api/solicitudes-acceso/:id/rechazar ─────────────────────────────
router.patch('/:id/rechazar', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute(
      "UPDATE usuarios SET activo = FALSE, estado_registro = 'rechazado' WHERE id = ?",
      [id]
    );
    return res.json({ message: 'Cuenta rechazada.' });
  } catch (err) {
    console.error('[solicitudes-acceso rechazar]', err);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;
