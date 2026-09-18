const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/require-admin');

const router = express.Router();

router.use(auth);
router.use(requireAdmin);

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        a.id,
        a.usuario_id,
        a.deporte_id,
        a.categoria_id,
        u.nombre,
        u.apellido,
        u.email,
        u.telefono,
        a.dni,
        a.fecha_nacimiento,
        a.fecha_alta AS fecha_inscripcion,
        a.observaciones,
        d.nombre AS deporte,
        c.nombre AS categoria,
        a.estado_medico AS estado
      FROM atletas a
      JOIN usuarios u ON u.id = a.usuario_id
      LEFT JOIN deportes d ON d.id = a.deporte_id
      LEFT JOIN categorias c ON c.id = a.categoria_id
      ORDER BY a.id DESC
    `);

    return res.json(rows);
  } catch (error) {
    console.error('[atletas GET]', error);
    return res.status(500).json({ message: 'Error al listar atletas.' });
  }
});

router.post('/', async (req, res) => {
  const {
    nombre,
    apellido,
    email,
    password,
    telefono,
    direccion,
    genero,
    fecha_nacimiento,
    dni,
    deporte_id,
    categoria_id,
    fecha_inscripcion,
    estado_inicial
  } = req.body;

  if (!nombre || !apellido || !email || !dni || !deporte_id) {
    return res.status(400).json({
      message: 'Nombre, apellido, email, documento y deporte son obligatorios.'
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const finalPassword = password || 'Atleta1234!';
  const estado = ['activo', 'inactivo', 'pendiente'].includes(String(estado_inicial || 'activo').toLowerCase())
    ? String(estado_inicial).toLowerCase()
    : 'activo';

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [usuarioExistente] = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [normalizedEmail]
    );

    if (usuarioExistente.length > 0) {
      return res.status(409).json({ message: 'Ya existe un usuario registrado con ese correo electrónico.' });
    }

    const [roles] = await connection.execute(
      "SELECT id FROM roles WHERE nombre = 'atleta' LIMIT 1"
    );
    const rolId = roles[0]?.id ?? 3;
    const passwordHash = await bcrypt.hash(finalPassword, 12);

    const [insertUsuario] = await connection.execute(
      `INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono, activo)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [rolId, String(nombre).trim(), String(apellido).trim(), normalizedEmail, passwordHash, telefono || null]
    );

    const usuarioId = insertUsuario.insertId;
    const fechaAlta = fecha_inscripcion || new Date().toISOString().slice(0, 10);
    const estadoMedico = estado === 'inactivo' ? 'pendiente' : estado === 'activo' ? 'apto' : 'pendiente';
    const observaciones = [
      direccion ? `Dirección: ${direccion}` : null,
      genero ? `Género: ${genero}` : null,
      fecha_nacimiento ? `Fecha de nacimiento: ${fecha_nacimiento}` : null
    ].filter(Boolean).join(' | ');

    const [insertAtleta] = await connection.execute(
      `INSERT INTO atletas (
        usuario_id, deporte_id, categoria_id, fecha_nacimiento, dni, numero_socio,
        fecha_alta, posicion, estado_medico, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuarioId,
        Number(deporte_id),
        categoria_id ? Number(categoria_id) : null,
        fecha_nacimiento || null,
        String(dni).trim(),
        null,
        fechaAlta,
        null,
        estadoMedico,
        observaciones || null
      ]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Atleta registrado correctamente.',
      usuarioId,
      atletaId: insertAtleta.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('[atletas POST]', error);
    return res.status(500).json({
      message: 'No se pudo registrar el atleta en la base de datos.'
    });
  } finally {
    connection.release();
  }
});

router.put('/:id', async (req, res) => {
  const {
    nombre, apellido, email, telefono, direccion, genero, fecha_nacimiento,
    dni, deporte_id, categoria_id, fecha_inscripcion, estado_inicial
  } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      'SELECT usuario_id, observaciones FROM atletas WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Atleta no encontrado.' });
    }

    const usuarioId = rows[0].usuario_id;
    const observaciones = [
      direccion ? `Dirección: ${direccion}` : null,
      genero ? `Género: ${genero}` : null,
      fecha_nacimiento ? `Fecha de nacimiento: ${fecha_nacimiento}` : null
    ].filter(Boolean).join(' | ') || null;
    const estadoMedico = estado_inicial === 'activo' ? 'apto' : estado_inicial === 'inactivo' ? 'pendiente' : 'pendiente';

    await connection.execute(
      `UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, telefono = ? WHERE id = ?`,
      [String(nombre).trim(), String(apellido).trim(), String(email).trim().toLowerCase(), telefono || null, usuarioId]
    );
    await connection.execute(
      `UPDATE atletas SET deporte_id = ?, categoria_id = ?, fecha_nacimiento = ?, dni = ?,
       fecha_alta = ?, estado_medico = ?, observaciones = ? WHERE id = ?`,
      [Number(deporte_id), categoria_id ? Number(categoria_id) : null, fecha_nacimiento || null,
        String(dni).trim(), fecha_inscripcion || new Date().toISOString().slice(0, 10), estadoMedico, observaciones, req.params.id]
    );

    await connection.commit();
    return res.json({ message: 'Atleta actualizado correctamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('[atletas PUT]', error);
    return res.status(500).json({ message: 'No se pudo actualizar el atleta.' });
  } finally {
    connection.release();
  }
});

router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [atletaRows] = await connection.execute('SELECT usuario_id FROM atletas WHERE id = ?', [req.params.id]);
    if (!atletaRows.length) {
      return res.status(404).json({ message: 'Atleta no encontrado.' });
    }

    const usuarioId = atletaRows[0].usuario_id;

    await connection.execute('DELETE FROM atletas WHERE id = ?', [req.params.id]);
    await connection.execute('DELETE FROM usuarios WHERE id = ?', [usuarioId]);

    await connection.commit();
    return res.json({ message: 'Atleta eliminado correctamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('[atletas DELETE]', error);
    return res.status(500).json({ message: 'No se pudo eliminar el atleta.' });
  } finally {
    connection.release();
  }
});

module.exports = router;
