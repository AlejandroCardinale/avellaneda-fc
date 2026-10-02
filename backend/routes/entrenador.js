const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const requireEntrenador = require('../middleware/require-entrenador');

const router = express.Router();
router.use(auth, requireEntrenador);

async function findCoach(userId) {
  const [rows] = await pool.execute(`
    SELECT e.id, e.deporte_id, e.especialidad, e.licencia, e.fecha_ingreso,
           u.id AS usuario_id, u.nombre, u.apellido, u.email, u.telefono,
           d.nombre AS deporte
    FROM entrenadores e
    JOIN usuarios u ON u.id = e.usuario_id
    JOIN deportes d ON d.id = e.deporte_id
    WHERE e.usuario_id = ? AND u.activo = TRUE
    LIMIT 1
  `, [userId]);
  return rows[0] || null;
}

function normalizeDateTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${value.replace('T', ' ')}:00`;
}

function validateSession(body, deporteId) {
  const titulo = String(body.titulo || '').trim();
  const fechaHora = normalizeDateTime(body.fecha_hora);
  const duracion = Number(body.duracion_min || 90);
  const categoriaId = body.categoria_id ? Number(body.categoria_id) : null;
  const instalacionId = body.instalacion_id ? Number(body.instalacion_id) : null;

  if (!titulo || titulo.length > 120 || !fechaHora || !Number.isInteger(duracion) || duracion < 15 || duracion > 360) {
    return { error: 'Indica un título, fecha y duración válida (entre 15 y 360 minutos).' };
  }
  if (categoriaId !== null && (!Number.isInteger(categoriaId) || categoriaId <= 0)) {
    return { error: 'La categoría seleccionada no es válida.' };
  }
  if (instalacionId !== null && (!Number.isInteger(instalacionId) || instalacionId <= 0)) {
    return { error: 'La instalación seleccionada no es válida.' };
  }
  return {
    values: {
      titulo,
      descripcion: String(body.descripcion || '').trim() || null,
      fechaHora,
      duracion,
      categoriaId,
      instalacionId,
      deporteId
    }
  };
}

async function validateSessionRelations(connection, values) {
  if (values.categoriaId) {
    const [categories] = await connection.execute(
      'SELECT id FROM categorias WHERE id = ? AND deporte_id = ?',
      [values.categoriaId, values.deporteId]
    );
    if (!categories.length) return 'La categoría no pertenece a tu disciplina.';
  }
  if (values.instalacionId) {
    const [facilities] = await connection.execute(
      'SELECT id FROM instalaciones WHERE id = ? AND activa = TRUE',
      [values.instalacionId]
    );
    if (!facilities.length) return 'La instalación no existe o no está disponible.';
  }
  return null;
}

async function findOwnedSession(sessionId, coachId) {
  const [rows] = await pool.execute(
    'SELECT id, deporte_id, categoria_id FROM sesiones WHERE id = ? AND entrenador_id = ?',
    [sessionId, coachId]
  );
  return rows[0] || null;
}

router.get('/dashboard', async (req, res) => {
  try {
    const coach = await findCoach(req.usuario.id);
    if (!coach) return res.status(404).json({ message: 'No se encontró el perfil de entrenador.' });

    const [[athletes]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM atletas a JOIN usuarios u ON u.id = a.usuario_id
       WHERE a.deporte_id = ? AND a.estado_medico <> 'no_apto' AND u.activo = TRUE`,
      [coach.deporte_id]
    );
    const [[sessions]] = await pool.execute(
      `SELECT COUNT(*) AS total,
       SUM(CASE WHEN estado = 'programada' AND fecha_hora >= NOW() THEN 1 ELSE 0 END) AS proximas
       FROM sesiones WHERE entrenador_id = ?`,
      [coach.id]
    );
    const [upcoming] = await pool.execute(`
      SELECT s.id, s.titulo, s.fecha_hora, s.duracion_min, s.estado,
             c.nombre AS categoria, i.nombre AS instalacion
      FROM sesiones s
      LEFT JOIN categorias c ON c.id = s.categoria_id
      LEFT JOIN instalaciones i ON i.id = s.instalacion_id
      WHERE s.entrenador_id = ? AND s.fecha_hora >= NOW() AND s.estado <> 'cancelada'
      ORDER BY s.fecha_hora LIMIT 5
    `, [coach.id]);

    return res.json({
      entrenador: coach,
      resumen: { atletas: Number(athletes.total || 0), sesiones: Number(sessions.total || 0), proximas: Number(sessions.proximas || 0) },
      proximosEntrenamientos: upcoming
    });
  } catch (error) {
    console.error('[entrenador dashboard]', error);
    return res.status(500).json({ message: 'No se pudo cargar el panel del entrenador.' });
  }
});

router.get('/atletas', async (req, res) => {
  try {
    const coach = await findCoach(req.usuario.id);
    if (!coach) return res.status(404).json({ message: 'No se encontró el perfil de entrenador.' });
    const [rows] = await pool.execute(`
      SELECT a.id, a.usuario_id, a.categoria_id, a.fecha_nacimiento, a.fecha_alta,
             a.posicion, a.estado_medico, u.nombre, u.apellido, u.email, u.telefono,
             c.nombre AS categoria
      FROM atletas a
      JOIN usuarios u ON u.id = a.usuario_id
      LEFT JOIN categorias c ON c.id = a.categoria_id
      WHERE a.deporte_id = ? AND a.estado_medico <> 'no_apto' AND u.activo = TRUE
      ORDER BY c.nombre, u.apellido, u.nombre
    `, [coach.deporte_id]);
    return res.json(rows);
  } catch (error) {
    console.error('[entrenador atletas]', error);
    return res.status(500).json({ message: 'No se pudo cargar el plantel.' });
  }
});

router.get('/catalogos', async (req, res) => {
  try {
    const coach = await findCoach(req.usuario.id);
    if (!coach) return res.status(404).json({ message: 'No se encontró el perfil de entrenador.' });
    const [categorias] = await pool.execute(
      'SELECT id, nombre FROM categorias WHERE deporte_id = ? ORDER BY nombre',
      [coach.deporte_id]
    );
    const [instalaciones] = await pool.execute(
      'SELECT id, nombre FROM instalaciones WHERE activa = TRUE ORDER BY nombre'
    );
    return res.json({ categorias, instalaciones });
  } catch (error) {
    console.error('[entrenador catalogos]', error);
    return res.status(500).json({ message: 'No se pudieron cargar las opciones de entrenamiento.' });
  }
});

router.get('/sesiones', async (req, res) => {
  try {
    const coach = await findCoach(req.usuario.id);
    if (!coach) return res.status(404).json({ message: 'No se encontró el perfil de entrenador.' });
    const [rows] = await pool.execute(`
      SELECT s.id, s.titulo, s.descripcion, s.fecha_hora, s.duracion_min, s.estado,
             s.categoria_id, s.instalacion_id, c.nombre AS categoria, i.nombre AS instalacion,
             (SELECT COUNT(*) FROM atletas a JOIN usuarios u ON u.id = a.usuario_id
              WHERE a.deporte_id = s.deporte_id AND a.estado_medico <> 'no_apto' AND u.activo = TRUE
              AND (s.categoria_id IS NULL OR a.categoria_id = s.categoria_id)) AS total_atletas,
             (SELECT COUNT(*) FROM asistencias x WHERE x.sesion_id = s.id AND x.presente = TRUE) AS presentes
      FROM sesiones s
      LEFT JOIN categorias c ON c.id = s.categoria_id
      LEFT JOIN instalaciones i ON i.id = s.instalacion_id
      WHERE s.entrenador_id = ?
      ORDER BY s.fecha_hora DESC
    `, [coach.id]);
    return res.json(rows);
  } catch (error) {
    console.error('[entrenador sesiones GET]', error);
    return res.status(500).json({ message: 'No se pudieron cargar los entrenamientos.' });
  }
});

router.post('/sesiones', async (req, res) => {
  const coach = await findCoach(req.usuario.id).catch(() => null);
  if (!coach) return res.status(404).json({ message: 'No se encontró el perfil de entrenador.' });
  const validation = validateSession(req.body, coach.deporte_id);
  if (validation.error) return res.status(400).json({ message: validation.error });
  const values = validation.values;
  const connection = await pool.getConnection();
  try {
    const relationError = await validateSessionRelations(connection, values);
    if (relationError) return res.status(400).json({ message: relationError });
    const [result] = await connection.execute(`
      INSERT INTO sesiones (entrenador_id, deporte_id, categoria_id, instalacion_id, titulo, descripcion, fecha_hora, duracion_min)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [coach.id, values.deporteId, values.categoriaId, values.instalacionId, values.titulo, values.descripcion, values.fechaHora, values.duracion]);
    return res.status(201).json({ message: 'Entrenamiento creado.', id: result.insertId });
  } catch (error) {
    console.error('[entrenador sesiones POST]', error);
    return res.status(500).json({ message: 'No se pudo crear el entrenamiento.' });
  } finally {
    connection.release();
  }
});

router.put('/sesiones/:id', async (req, res) => {
  const coach = await findCoach(req.usuario.id).catch(() => null);
  if (!coach) return res.status(404).json({ message: 'No se encontró el perfil de entrenador.' });
  const validation = validateSession(req.body, coach.deporte_id);
  if (validation.error) return res.status(400).json({ message: validation.error });
  const values = validation.values;
  const connection = await pool.getConnection();
  try {
    const [owned] = await connection.execute(
      'SELECT id FROM sesiones WHERE id = ? AND entrenador_id = ?',
      [req.params.id, coach.id]
    );
    if (!owned.length) return res.status(404).json({ message: 'Entrenamiento no encontrado.' });
    const relationError = await validateSessionRelations(connection, values);
    if (relationError) return res.status(400).json({ message: relationError });
    await connection.execute(`
      UPDATE sesiones SET categoria_id = ?, instalacion_id = ?, titulo = ?, descripcion = ?, fecha_hora = ?, duracion_min = ?
      WHERE id = ? AND entrenador_id = ?
    `, [values.categoriaId, values.instalacionId, values.titulo, values.descripcion, values.fechaHora, values.duracion, req.params.id, coach.id]);
    return res.json({ message: 'Entrenamiento actualizado.' });
  } catch (error) {
    console.error('[entrenador sesiones PUT]', error);
    return res.status(500).json({ message: 'No se pudo actualizar el entrenamiento.' });
  } finally {
    connection.release();
  }
});

router.patch('/sesiones/:id/estado', async (req, res) => {
  const coach = await findCoach(req.usuario.id).catch(() => null);
  if (!coach) return res.status(404).json({ message: 'No se encontró el perfil de entrenador.' });
  const allowedStates = ['en_curso', 'finalizada', 'cancelada'];
  if (!allowedStates.includes(req.body.estado)) {
    return res.status(400).json({ message: 'El estado indicado no es válido.' });
  }
  try {
    const [result] = await pool.execute(
      'UPDATE sesiones SET estado = ? WHERE id = ? AND entrenador_id = ?',
      [req.body.estado, req.params.id, coach.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Entrenamiento no encontrado.' });
    return res.json({ message: 'Estado del entrenamiento actualizado.' });
  } catch (error) {
    console.error('[entrenador sesiones estado]', error);
    return res.status(500).json({ message: 'No se pudo actualizar el estado.' });
  }
});

router.get('/sesiones/:id/asistencias', async (req, res) => {
  const coach = await findCoach(req.usuario.id).catch(() => null);
  if (!coach) return res.status(404).json({ message: 'No se encontró el perfil de entrenador.' });
  try {
    const session = await findOwnedSession(req.params.id, coach.id);
    if (!session) return res.status(404).json({ message: 'Entrenamiento no encontrado.' });
    const [rows] = await pool.execute(`
      SELECT a.id AS atleta_id, u.nombre, u.apellido, c.nombre AS categoria,
             COALESCE(x.presente, FALSE) AS presente, COALESCE(x.observacion, '') AS observacion
      FROM atletas a
      JOIN usuarios u ON u.id = a.usuario_id
      LEFT JOIN categorias c ON c.id = a.categoria_id
      LEFT JOIN asistencias x ON x.atleta_id = a.id AND x.sesion_id = ?
      WHERE a.deporte_id = ? AND a.estado_medico <> 'no_apto' AND u.activo = TRUE
        AND (? IS NULL OR a.categoria_id = ?)
      ORDER BY u.apellido, u.nombre
    `, [session.id, session.deporte_id, session.categoria_id, session.categoria_id]);
    return res.json(rows);
  } catch (error) {
    console.error('[entrenador asistencias GET]', error);
    return res.status(500).json({ message: 'No se pudo cargar la asistencia.' });
  }
});

router.put('/sesiones/:id/asistencias', async (req, res) => {
  const coach = await findCoach(req.usuario.id).catch(() => null);
  if (!coach) return res.status(404).json({ message: 'No se encontró el perfil de entrenador.' });
  const attendance = req.body.asistencias;
  if (!Array.isArray(attendance)) return res.status(400).json({ message: 'La lista de asistencias no es válida.' });
  const uniqueAthleteIds = [...new Set(attendance.map(item => Number(item.atleta_id)))];
  if (uniqueAthleteIds.some(id => !Number.isInteger(id) || id <= 0) || uniqueAthleteIds.length !== attendance.length) {
    return res.status(400).json({ message: 'Hay atletas duplicados o identificadores inválidos.' });
  }
  if (attendance.some(item => typeof item.presente !== 'boolean' || String(item.observacion || '').length > 200)) {
    return res.status(400).json({ message: 'Revisa los estados y observaciones de asistencia.' });
  }

  const connection = await pool.getConnection();
  try {
    const [sessionRows] = await connection.execute(
      'SELECT id, deporte_id, categoria_id FROM sesiones WHERE id = ? AND entrenador_id = ?',
      [req.params.id, coach.id]
    );
    if (!sessionRows.length) return res.status(404).json({ message: 'Entrenamiento no encontrado.' });
    const session = sessionRows[0];
    if (uniqueAthleteIds.length) {
      const placeholders = uniqueAthleteIds.map(() => '?').join(',');
      const [athletes] = await connection.execute(`
        SELECT a.id FROM atletas a
        JOIN usuarios u ON u.id = a.usuario_id AND u.activo = TRUE
        WHERE a.id IN (${placeholders}) AND a.deporte_id = ?
          AND a.estado_medico <> 'no_apto' AND (? IS NULL OR a.categoria_id = ?)
      `, [...uniqueAthleteIds, session.deporte_id, session.categoria_id, session.categoria_id]);
      if (athletes.length !== uniqueAthleteIds.length) {
        return res.status(403).json({ message: 'La asistencia incluye atletas fuera de este plantel.' });
      }
    }

    await connection.beginTransaction();
    for (const item of attendance) {
      await connection.execute(`
        INSERT INTO asistencias (sesion_id, atleta_id, presente, observacion)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE presente = VALUES(presente), observacion = VALUES(observacion), registrado_en = CURRENT_TIMESTAMP
      `, [session.id, Number(item.atleta_id), item.presente, String(item.observacion || '').trim() || null]);
    }
    await connection.commit();
    return res.json({ message: 'Asistencia guardada.' });
  } catch (error) {
    await connection.rollback();
    console.error('[entrenador asistencias PUT]', error);
    return res.status(500).json({ message: 'No se pudo guardar la asistencia.' });
  } finally {
    connection.release();
  }
});

module.exports = router;