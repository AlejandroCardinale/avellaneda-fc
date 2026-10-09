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
      `SELECT
         u.id,
         u.nombre,
         u.apellido,
         u.email,
         u.telefono,
         u.activo,
         u.estado_registro,
         u.creado_en,
         r.nombre AS rol,
         a.dni,
         a.numero_socio,
         a.posicion,
         c.nombre AS categoria,
         e.especialidad,
         e.licencia,
         COALESCE(d_a.nombre, d_e.nombre) AS deporte
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       LEFT JOIN atletas a ON a.usuario_id = u.id
       LEFT JOIN deportes d_a ON d_a.id = a.deporte_id
       LEFT JOIN categorias c ON c.id = a.categoria_id
       LEFT JOIN entrenadores e ON e.usuario_id = u.id
       LEFT JOIN deportes d_e ON d_e.id = e.deporte_id
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

// ─── APROBAR (PATCH y PUT) ──────────────────────────────────────────────────
const aprobarHandler = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Obtener usuario y su rol
    const [userRows] = await connection.execute(
      `SELECT u.id, u.nombre, u.apellido, u.email, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.id = ?`,
      [id]
    );

    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const usuario = userRows[0];

    // 2. Si es Atleta, asegurar que exista el registro en la tabla atletas
    if (usuario.rol === 'atleta') {
      const [atletaRows] = await connection.execute(
        'SELECT id FROM atletas WHERE usuario_id = ?',
        [usuario.id]
      );

      if (atletaRows.length === 0) {
        const deporteId = Number(req.body.deporte_id) > 0 ? Number(req.body.deporte_id) : 1;
        const categoriaId = Number(req.body.categoria_id) > 0 ? Number(req.body.categoria_id) : 1;
        const dni = req.body.dni && String(req.body.dni).trim() !== '' ? String(req.body.dni).trim() : null;
        const numeroSocio = req.body.numero_socio && String(req.body.numero_socio).trim() !== '' ? String(req.body.numero_socio).trim() : null;
        const posicion = req.body.posicion && String(req.body.posicion).trim() !== '' ? String(req.body.posicion).trim() : null;

        await connection.execute(
          `INSERT INTO atletas (
            usuario_id, deporte_id, categoria_id, dni, numero_socio, posicion, entrenador_id, estado_medico
          ) VALUES (?, ?, ?, ?, ?, ?, NULL, 'apto')`,
          [usuario.id, deporteId, categoriaId, dni, numeroSocio, posicion]
        );
      } else {
        await connection.execute(
          "UPDATE atletas SET estado_medico = 'apto' WHERE usuario_id = ?",
          [usuario.id]
        );
      }
    }

    // 3. Si es Entrenador, asegurar que exista el registro en la tabla entrenadores
    if (usuario.rol === 'entrenador') {
      const [coachRows] = await connection.execute(
        'SELECT id FROM entrenadores WHERE usuario_id = ?',
        [usuario.id]
      );

      if (coachRows.length === 0) {
        const deporteId = Number(req.body.deporte_id) > 0 ? Number(req.body.deporte_id) : 1;
        const especialidad = req.body.especialidad && String(req.body.especialidad).trim() !== '' ? String(req.body.especialidad).trim() : 'General';
        const licencia = req.body.licencia && String(req.body.licencia).trim() !== '' ? String(req.body.licencia).trim() : null;

        await connection.execute(
          `INSERT INTO entrenadores (
            usuario_id, deporte_id, especialidad, licencia
          ) VALUES (?, ?, ?, ?)`,
          [usuario.id, deporteId, especialidad, licencia]
        );
      }
    }

    // 4. Activar usuario y cambiar estado a 'aprobado'
    await connection.execute(
      "UPDATE usuarios SET activo = TRUE, estado_registro = 'aprobado' WHERE id = ?",
      [id]
    );

    await connection.commit();
    return res.json({ message: 'Cuenta aprobada y perfil registrado correctamente.' });
  } catch (err) {
    await connection.rollback();
    console.error('[solicitudes-acceso aprobar]', err);
    return res.status(500).json({ message: 'Error interno del servidor al aprobar la solicitud.' });
  } finally {
    connection.release();
  }
};
router.patch('/:id/aprobar', aprobarHandler);
router.put('/:id/aprobar',   aprobarHandler);

// ─── RECHAZAR (PATCH y PUT) ─────────────────────────────────────────────────
const rechazarHandler = async (req, res) => {
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
};
router.patch('/:id/rechazar', rechazarHandler);
router.put('/:id/rechazar',   rechazarHandler);

module.exports = router;
