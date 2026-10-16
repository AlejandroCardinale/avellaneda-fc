const express = require('express');
const bcrypt  = require('bcrypt');
const pool    = require('../db');
const auth    = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Middleware: solo atletas
router.use((req, res, next) => {
  if (req.usuario?.rol !== 'atleta') {
    return res.status(403).json({ message: 'Acceso exclusivo para atletas.' });
  }
  return next();
});

/** Busca el registro de atleta correspondiente al usuario logueado */
async function findAtleta(userId) {
  // Verificamos si la columna entrenador_id existe en la tabla atletas
  const [cols] = await pool.execute(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'atletas' AND COLUMN_NAME = 'entrenador_id'
  `);
  const hasEntrenadorId = cols.length > 0;

  const sql = hasEntrenadorId
    ? `SELECT a.id, a.usuario_id, a.entrenador_id, a.deporte_id, a.categoria_id,
              a.dni, a.fecha_nacimiento, a.fecha_alta, a.posicion, a.estado_medico, a.observaciones,
              u.nombre, u.apellido, u.email, u.telefono,
              d.nombre AS deporte, c.nombre AS categoria,
              CONCAT(ue.nombre, ' ', ue.apellido) AS entrenador_nombre
       FROM atletas a
       JOIN usuarios u ON u.id = a.usuario_id
       LEFT JOIN deportes d ON d.id = a.deporte_id
       LEFT JOIN categorias c ON c.id = a.categoria_id
       LEFT JOIN entrenadores e ON e.id = a.entrenador_id
       LEFT JOIN usuarios ue ON ue.id = e.usuario_id
       WHERE a.usuario_id = ? AND u.activo = TRUE LIMIT 1`
    : `SELECT a.id, a.usuario_id, NULL AS entrenador_id, a.deporte_id, a.categoria_id,
              a.dni, a.fecha_nacimiento, a.fecha_alta, a.posicion, a.estado_medico, a.observaciones,
              u.nombre, u.apellido, u.email, u.telefono,
              d.nombre AS deporte, c.nombre AS categoria, NULL AS entrenador_nombre
       FROM atletas a
       JOIN usuarios u ON u.id = a.usuario_id
       LEFT JOIN deportes d ON d.id = a.deporte_id
       LEFT JOIN categorias c ON c.id = a.categoria_id
       WHERE a.usuario_id = ? AND u.activo = TRUE LIMIT 1`;

  const [rows] = await pool.execute(sql, [userId]);
  return rows[0] || null;
}

// ── GET /api/atleta/perfil ─────────────────────────────────────────────────
router.get('/perfil', async (req, res) => {
  try {
    const atleta = await findAtleta(req.usuario.id);
    if (!atleta) return res.status(404).json({ message: 'No se encontró el perfil de atleta.' });
    return res.json(atleta);
  } catch (error) {
    console.error('[atleta GET /perfil]', error);
    return res.status(500).json({ message: 'No se pudo cargar el perfil.' });
  }
});

// ── PUT /api/atleta/perfil ─────────────────────────────────────────────────
router.put('/perfil', async (req, res) => {
  const { nombre, apellido, telefono, password_actual, password_nueva } = req.body;

  if (!nombre || !apellido) {
    return res.status(400).json({ message: 'Nombre y apellido son obligatorios.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const atleta = await findAtleta(req.usuario.id);
    if (!atleta) {
      await connection.rollback();
      return res.status(404).json({ message: 'No se encontró el perfil de atleta.' });
    }

    // Si quiere cambiar contraseña, verificar la actual
    if (password_nueva) {
      if (!password_actual) {
        await connection.rollback();
        return res.status(400).json({ message: 'Debés ingresar tu contraseña actual para cambiarla.' });
      }
      const [userRows] = await connection.execute(
        'SELECT password_hash FROM usuarios WHERE id = ?', [atleta.usuario_id]
      );
      const match = await bcrypt.compare(String(password_actual), userRows[0].password_hash);
      if (!match) {
        await connection.rollback();
        return res.status(401).json({ message: 'La contraseña actual no es correcta.' });
      }
      if (String(password_nueva).length < 6) {
        await connection.rollback();
        return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      }
      const hash = await bcrypt.hash(String(password_nueva), 12);
      await connection.execute(
        'UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, atleta.usuario_id]
      );
    }

    await connection.execute(
      'UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ? WHERE id = ?',
      [String(nombre).trim(), String(apellido).trim(), telefono || null, atleta.usuario_id]
    );

    await connection.commit();
    return res.json({ message: 'Perfil actualizado correctamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('[atleta PUT /perfil]', error);
    return res.status(500).json({ message: 'No se pudo actualizar el perfil.' });
  } finally {
    connection.release();
  }
});

// ── GET /api/atleta/entrenamientos ────────────────────────────────────────
router.get('/entrenamientos', async (req, res) => {
  try {
    const atleta = await findAtleta(req.usuario.id);
    if (!atleta) return res.status(404).json({ message: 'No se encontró el perfil de atleta.' });

    const [rows] = await pool.execute(`
      SELECT s.id, s.titulo, s.descripcion, s.fecha_hora, s.duracion_min, s.estado,
             c.nombre AS categoria, i.nombre AS instalacion,
             CONCAT(ue.nombre, ' ', ue.apellido) AS entrenador,
             COALESCE(a.presente, NULL) AS presente,
             a.observacion
      FROM sesiones s
      LEFT JOIN categorias c ON c.id = s.categoria_id
      LEFT JOIN instalaciones i ON i.id = s.instalacion_id
      LEFT JOIN entrenadores e ON e.id = s.entrenador_id
      LEFT JOIN usuarios ue ON ue.id = e.usuario_id
      LEFT JOIN asistencias a ON a.sesion_id = s.id AND a.atleta_id = ?
      WHERE s.deporte_id = ?
        AND (s.categoria_id IS NULL OR s.categoria_id = ?)
        AND s.estado <> 'cancelada'
      ORDER BY s.fecha_hora DESC
      LIMIT 30
    `, [atleta.id, atleta.deporte_id, atleta.categoria_id]);

    return res.json(rows);
  } catch (error) {
    console.error('[atleta GET /entrenamientos]', error);
    return res.status(500).json({ message: 'No se pudieron cargar los entrenamientos.' });
  }
});

// ── GET /api/atleta/asistencias ──────────────────────────────────────────
router.get('/asistencias', async (req, res) => {
  try {
    const atleta = await findAtleta(req.usuario.id);
    if (!atleta) return res.status(404).json({ message: 'No se encontró el perfil de atleta.' });

    // Resumen global
    const [[counts]] = await pool.execute(`
      SELECT
        COUNT(*) AS total_sesiones,
        SUM(CASE WHEN a.presente = TRUE THEN 1 ELSE 0 END) AS presentes,
        SUM(CASE WHEN a.presente = FALSE THEN 1 ELSE 0 END) AS ausencias,
        SUM(CASE WHEN a.presente = FALSE AND NULLIF(TRIM(a.observacion),'') IS NOT NULL
                   AND UPPER(TRIM(a.observacion)) <> 'INJUSTIFICADO' THEN 1 ELSE 0 END) AS justificadas,
        SUM(CASE WHEN a.presente = FALSE AND (NULLIF(TRIM(a.observacion),'') IS NULL
                   OR UPPER(TRIM(a.observacion)) = 'INJUSTIFICADO') THEN 1 ELSE 0 END) AS injustificadas
      FROM asistencias a
      JOIN sesiones s ON s.id = a.sesion_id
      WHERE a.atleta_id = ? AND s.estado IN ('en_curso', 'finalizada')
    `, [atleta.id]);

    // Registros individuales
    const [registros] = await pool.execute(`
      SELECT s.id AS sesion_id, s.titulo, s.fecha_hora, s.estado,
             a.presente, a.observacion
      FROM asistencias a
      JOIN sesiones s ON s.id = a.sesion_id
      WHERE a.atleta_id = ? AND s.estado IN ('en_curso', 'finalizada')
      ORDER BY s.fecha_hora DESC
      LIMIT 20
    `, [atleta.id]);

    const total = Number(counts.total_sesiones || 0);
    const presentes = Number(counts.presentes || 0);

    return res.json({
      totalSesiones: total,
      presentes,
      ausencias: Number(counts.ausencias || 0),
      justificadas: Number(counts.justificadas || 0),
      injustificadas: Number(counts.injustificadas || 0),
      porcentajeAsistencia: total ? Math.round((presentes / total) * 100) : 0,
      registros: registros.map(r => ({
        ...r,
        presente: r.presente === null ? null : Boolean(r.presente),
        observacion: r.observacion || ''
      }))
    });
  } catch (error) {
    console.error('[atleta GET /asistencias]', error);
    return res.status(500).json({ message: 'No se pudo cargar el historial de asistencias.' });
  }
});

module.exports = router;
