const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/require-admin');

const router = express.Router();

router.use(auth);
router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const { rol, search, page = 1, pageSize = 8 } = req.query;
    const pageNumber = Math.max(1, Number(page));
    const size = Math.max(1, Number(pageSize));
    const offset = (pageNumber - 1) * size;

    let sql = `
      SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.avatar_url, u.activo,
             r.nombre AS rol, u.creado_en, u.ultimo_login
      FROM usuarios u
      JOIN roles r ON r.id = u.rol_id
      WHERE 1 = 1
    `;
    const params = [];

    if (rol && rol !== 'Todos') {
      sql += ' AND r.nombre = ?';
      params.push(rol.toLowerCase());
    }

    if (search && String(search).trim()) {
      const q = `%${String(search).trim()}%`;
      sql += ' AND (u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)';
      params.push(q, q, q);
    }

    const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM (${sql}) AS filtered`, params);
    const total = Number(countRows[0]?.total || 0);

    const [rows] = await pool.execute(`${sql} ORDER BY u.creado_en DESC LIMIT ? OFFSET ?`, [...params, size, offset]);

    return res.json({
      data: rows,
      total,
      page: pageNumber,
      pageSize: size,
      totalPages: Math.max(1, Math.ceil(total / size))
    });
  } catch (error) {
    console.error('[usuarios GET]', error);
    return res.status(500).json({ message: 'Error al cargar usuarios.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.avatar_url, u.activo,
             r.nombre AS rol, u.creado_en, u.ultimo_login
      FROM usuarios u
      JOIN roles r ON r.id = u.rol_id
      WHERE u.id = ?
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado.' });
    return res.json(rows[0]);
  } catch (error) {
    console.error('[usuarios GET by id]', error);
    return res.status(500).json({ message: 'Error al buscar usuario.' });
  }
});

router.patch('/:id/activo', async (req, res) => {
  try {
    const { activo } = req.body;
    const [result] = await pool.execute('UPDATE usuarios SET activo = ? WHERE id = ?', [Boolean(activo), req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Usuario no encontrado.' });
    return res.json({ message: 'Estado actualizado.' });
  } catch (error) {
    console.error('[usuarios patch activo]', error);
    return res.status(500).json({ message: 'Error al actualizar estado.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Usuario no encontrado.' });
    return res.json({ message: 'Usuario eliminado.' });
  } catch (error) {
    console.error('[usuarios delete]', error);
    return res.status(500).json({ message: 'Error al eliminar usuario.' });
  }
});

module.exports = router;
