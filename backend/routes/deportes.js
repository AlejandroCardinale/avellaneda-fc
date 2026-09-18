const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pool = require('../db');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/require-admin');

const router = express.Router();
const uploadDirectory = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });
const uploadImage = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => callback(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, file.mimetype.startsWith('image/'))
});

router.use(auth, requireAdmin);

const listQuery = `
  SELECT d.id, d.nombre, d.descripcion, d.icono, d.imagen_url, d.activo, d.creado_en,
         GROUP_CONCAT(DISTINCT c.nombre ORDER BY c.nombre SEPARATOR ', ') AS categoria,
         (SELECT COUNT(*) FROM atletas a WHERE a.deporte_id = d.id) AS atletas,
         (SELECT COUNT(*) FROM entrenadores e WHERE e.deporte_id = d.id) AS entrenadores
  FROM deportes d
  LEFT JOIN categorias c ON c.deporte_id = d.id
`;

function validate(body) {
  const nombre = String(body.nombre || '').trim();
  const descripcion = String(body.descripcion || '').trim();
  const categoria = String(body.categoria || '').trim();
  const icono = String(body.icono || 'fa-futbol').trim();
  const activo = !(body.activo === false || body.activo === 'false' || body.activo === '0');
  if (!nombre || !descripcion || !categoria) return { error: 'Nombre, categoría y descripción son obligatorios.' };
  return { nombre, descripcion, categoria, icono, activo };
}

router.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const activo = req.query.activo === 'todos' ? null : req.query.activo !== 'false';
    const params = [];
    const filters = ['1 = 1'];
    if (search) {
      filters.push('(d.nombre LIKE ? OR d.descripcion LIKE ? OR c.nombre LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (activo !== null) { filters.push('d.activo = ?'); params.push(activo); }
    const where = filters.join(' AND ');
    const [[count]] = await pool.execute(`SELECT COUNT(DISTINCT d.id) AS total FROM deportes d LEFT JOIN categorias c ON c.deporte_id = d.id WHERE ${where}`, params);
    const [rows] = await pool.execute(`${listQuery} WHERE ${where} GROUP BY d.id ORDER BY d.nombre`, params);
    return res.json({ data: rows, total: Number(count.total || 0) });
  } catch (error) {
    console.error('[deportes GET]', error);
    return res.status(500).json({ message: 'No se pudieron cargar los deportes.' });
  }
});

router.post('/', uploadImage.single('imagen'), async (req, res) => {
  const body = req.file ? { ...req.body, imagen_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` } : req.body;
  const data = validate(body);
  if (data.error) return res.status(400).json({ message: data.error });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'INSERT INTO deportes (nombre, descripcion, icono, imagen_url, activo) VALUES (?, ?, ?, ?, ?)',
      [data.nombre, data.descripcion, data.icono, body.imagen_url || null, data.activo]
    );
    await connection.execute('INSERT INTO categorias (deporte_id, nombre) VALUES (?, ?)', [result.insertId, data.categoria]);
    await connection.commit();
    return res.status(201).json({ message: 'Deporte creado correctamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('[deportes POST]', error);
    return res.status(500).json({ message: 'No se pudo crear el deporte.' });
  } finally { connection.release(); }
});

router.put('/:id', uploadImage.single('imagen'), async (req, res) => {
  const body = req.file ? { ...req.body, imagen_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` } : req.body;
  const data = validate(body);
  if (data.error) return res.status(400).json({ message: data.error });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      'UPDATE deportes SET nombre = ?, descripcion = ?, icono = ?, imagen_url = COALESCE(?, imagen_url), activo = ? WHERE id = ?',
      [data.nombre, data.descripcion, data.icono, body.imagen_url || null, data.activo, req.params.id]
    );
    if (!result.affectedRows) { await connection.rollback(); return res.status(404).json({ message: 'Deporte no encontrado.' }); }
    const [categories] = await connection.execute('SELECT id FROM categorias WHERE deporte_id = ? ORDER BY id LIMIT 1', [req.params.id]);
    if (categories.length) await connection.execute('UPDATE categorias SET nombre = ? WHERE id = ?', [data.categoria, categories[0].id]);
    else await connection.execute('INSERT INTO categorias (deporte_id, nombre) VALUES (?, ?)', [req.params.id, data.categoria]);
    await connection.commit();
    return res.json({ message: 'Deporte actualizado correctamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('[deportes PUT]', error);
    return res.status(500).json({ message: 'No se pudo actualizar el deporte.' });
  } finally { connection.release(); }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('UPDATE deportes SET activo = FALSE WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Deporte no encontrado.' });
    return res.json({ message: 'Deporte eliminado correctamente.' });
  } catch (error) {
    console.error('[deportes DELETE]', error);
    return res.status(500).json({ message: 'No se pudo eliminar el deporte.' });
  }
});

module.exports = router;
