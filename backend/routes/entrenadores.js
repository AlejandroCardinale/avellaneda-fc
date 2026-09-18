const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/require-admin');

const router = express.Router();

router.use(auth);
router.use(requireAdmin);

const listQuery = `
  SELECT
    e.id,
    e.usuario_id,
    u.nombre,
    u.apellido,
    u.email,
    u.telefono,
    e.deporte_id,
    d.nombre AS deporte,
    e.especialidad,
    e.licencia,
    e.fecha_ingreso,
    CASE WHEN u.activo = TRUE THEN 'activo' ELSE 'inactivo' END AS estado
  FROM entrenadores e
  JOIN usuarios u ON u.id = e.usuario_id
  JOIN deportes d ON d.id = e.deporte_id
`;

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.execute(`${listQuery} ORDER BY u.apellido, u.nombre`);
    return res.json(rows);
  } catch (error) {
    console.error('[entrenadores GET]', error);
    return res.status(500).json({ message: 'Error al cargar entrenadores.' });
  }
});

router.post('/', async (req, res) => {
  const { nombre, apellido, email, telefono, deporte_id, especialidad, licencia, estado_inicial } = req.body;

  if (!nombre || !apellido || !email || !telefono || !deporte_id || !especialidad) {
    return res.status(400).json({ message: 'Nombre, apellido, email, teléfono, disciplina y especialidad son obligatorios.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const normalizedEmail = String(email).trim().toLowerCase();
    const [existing] = await connection.execute('SELECT id FROM usuarios WHERE email = ?', [normalizedEmail]);
    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({ message: 'Ya existe un usuario registrado con ese correo electrónico.' });
    }

    const [roles] = await connection.execute("SELECT id FROM roles WHERE nombre = 'entrenador' LIMIT 1");
    if (!roles.length) {
      await connection.rollback();
      return res.status(500).json({ message: 'No existe el rol entrenador en la base de datos.' });
    }

    const activo = String(estado_inicial).toLowerCase() !== 'inactivo';
    const passwordHash = await bcrypt.hash('Entrenador1234!', 12);
    const [userResult] = await connection.execute(
      `INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [roles[0].id, String(nombre).trim(), String(apellido).trim(), normalizedEmail, passwordHash, String(telefono).trim(), activo]
    );

    const [coachResult] = await connection.execute(
      `INSERT INTO entrenadores (usuario_id, deporte_id, especialidad, licencia)
       VALUES (?, ?, ?, ?)`,
      [userResult.insertId, Number(deporte_id), String(especialidad).trim(), licencia ? String(licencia).trim() : null]
    );

    await connection.commit();
    return res.status(201).json({
      message: 'Entrenador registrado correctamente.',
      usuarioId: userResult.insertId,
      entrenadorId: coachResult.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('[entrenadores POST]', error);
    return res.status(500).json({ message: 'No se pudo registrar el entrenador.' });
  } finally {
    connection.release();
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, apellido, email, telefono, deporte_id, especialidad, licencia, estado_inicial } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT usuario_id FROM entrenadores WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Entrenador no encontrado.' });
    }

    const activo = String(estado_inicial).toLowerCase() !== 'inactivo';
    await connection.execute(
      `UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, telefono = ?, activo = ? WHERE id = ?`,
      [String(nombre).trim(), String(apellido).trim(), String(email).trim().toLowerCase(), String(telefono).trim(), activo, rows[0].usuario_id]
    );
    await connection.execute(
      'UPDATE entrenadores SET deporte_id = ?, especialidad = ?, licencia = ? WHERE id = ?',
      [Number(deporte_id), String(especialidad).trim(), licencia ? String(licencia).trim() : null, req.params.id]
    );

    await connection.commit();
    return res.json({ message: 'Entrenador actualizado correctamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('[entrenadores PUT]', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe un usuario registrado con ese correo electrónico.' });
    }
    return res.status(500).json({ message: 'No se pudo actualizar el entrenador.' });
  } finally {
    connection.release();
  }
});

router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT usuario_id FROM entrenadores WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Entrenador no encontrado.' });
    }

    await connection.execute('DELETE FROM entrenadores WHERE id = ?', [req.params.id]);
    await connection.execute('DELETE FROM usuarios WHERE id = ?', [rows[0].usuario_id]);
    await connection.commit();
    return res.json({ message: 'Entrenador eliminado correctamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('[entrenadores DELETE]', error);
    return res.status(500).json({ message: 'No se pudo eliminar el entrenador.' });
  } finally {
    connection.release();
  }
});

module.exports = router;
