const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pool = require('../db');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/require-admin');

const router = express.Router();
const allowedCategories = ['Eventos', 'Instalaciones', 'Atletas', 'Comunicados', 'Deportes', 'Institucional'];
const allowedStatuses = ['publicada', 'borrador', 'programada'];

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

router.get('/publicas', async (_req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, titulo, descripcion, categoria, imagen_url, destacada,
             DATE_FORMAT(creado_en, '%Y-%m-%dT%H:%i:%s') AS fecha_publicacion
      FROM noticias
      WHERE publicada = TRUE AND creado_en <= NOW()
      ORDER BY creado_en DESC
    `);
    return res.json(rows);
  } catch (error) {
    console.error('[noticias:publicas]', error);
    return res.status(500).json({ message: 'No se pudieron cargar las noticias públicas.' });
  }
});

router.use(auth, requireAdmin);

function normalizeStatus(value) {
  return allowedStatuses.includes(value) ? value : 'borrador';
}

function validatePayload(body) {
  const titulo = String(body.titulo || '').trim();
  const descripcion = String(body.descripcion || '').trim();
  const categoria = String(body.categoria || 'Comunicados').trim();
  const imagenUrl = String(body.imagen_url || '').trim();
  const estado = normalizeStatus(body.estado);
  const fechaPublicacion = body.fecha_publicacion || null;

  if (!titulo || titulo.length > 160 || !descripcion || !categoria) {
    return { error: 'El título, la descripción y la categoría son obligatorios.' };
  }
  if (fechaPublicacion && Number.isNaN(Date.parse(fechaPublicacion))) {
    return { error: 'La fecha de publicación no es válida.' };
  }
  return { titulo, descripcion, categoria, imagenUrl, estado, fechaPublicacion };
}

function statusSql(status) {
  if (status === 'publicada') return 'publicada = TRUE';
  if (status === 'programada') return 'publicada = FALSE AND creado_en > NOW()';
  if (status === 'borrador') return 'publicada = FALSE AND creado_en <= NOW()';
  return '1 = 1';
}

const selectFields = `
  id, titulo, descripcion, categoria, imagen_url, destacada, publicada,
  creado_en, actualizado_en,
  CASE
    WHEN publicada = TRUE THEN 'publicada'
    WHEN creado_en > NOW() THEN 'programada'
    ELSE 'borrador'
  END AS estado,
  DATE_FORMAT(creado_en, '%Y-%m-%dT%H:%i:%s') AS fecha_publicacion
`;

router.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const status = allowedStatuses.includes(req.query.status) ? req.query.status : 'todas';
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(req.query.pageSize, 10) || 6, 1), 30);
    const order = req.query.order === 'oldest' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;
    const params = [];
    const filters = [statusSql(status)];

    if (search) {
      filters.push('(titulo LIKE ? OR descripcion LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = filters.join(' AND ');
    const [[countRow]] = await pool.execute(`SELECT COUNT(*) AS total FROM noticias WHERE ${where}`, params);
    const [rows] = await pool.execute(
      `SELECT ${selectFields} FROM noticias WHERE ${where} ORDER BY creado_en ${order} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    const [[metrics]] = await pool.execute(`
      SELECT
        SUM(publicada = TRUE) AS publicadas,
        SUM(publicada = FALSE AND creado_en <= NOW()) AS borradores,
        SUM(publicada = FALSE AND creado_en > NOW()) AS programadas
      FROM noticias
    `);

    return res.json({
      data: rows,
      total: Number(countRow.total || 0),
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(Number(countRow.total || 0) / pageSize), 1),
      metrics: {
        publicadas: Number(metrics.publicadas || 0),
        borradores: Number(metrics.borradores || 0),
        programadas: Number(metrics.programadas || 0)
      }
    });
  } catch (error) {
    console.error('[noticias:listar]', error);
    return res.status(500).json({ message: 'No se pudieron cargar las noticias.' });
  }
});

router.post('/', uploadImage.single('imagen'), async (req, res) => {
  const body = req.file
    ? { ...req.body, imagen_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` }
    : req.body;
  const payload = validatePayload(body);
  if (payload.error) return res.status(400).json({ message: payload.error });

  try {
    const fecha = payload.fechaPublicacion ? new Date(payload.fechaPublicacion) : new Date();
    const publicada = payload.estado === 'publicada';
    const [result] = await pool.execute(
      `INSERT INTO noticias (titulo, descripcion, categoria, imagen_url, destacada, publicada, creado_por, creado_en)
       VALUES (?, ?, ?, ?, FALSE, ?, ?, ?)`,
      [payload.titulo, payload.descripcion, payload.categoria, payload.imagenUrl || null, publicada, req.usuario.id, fecha]
    );
    return res.status(201).json({ message: 'Noticia creada correctamente.', id: result.insertId });
  } catch (error) {
    console.error('[noticias:crear]', error);
    return res.status(500).json({ message: 'No se pudo crear la noticia.' });
  }
});

router.put('/:id', uploadImage.single('imagen'), async (req, res) => {
  const body = req.file
    ? { ...req.body, imagen_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` }
    : req.body;
  const payload = validatePayload(body);
  if (payload.error) return res.status(400).json({ message: payload.error });

  try {
    const fecha = payload.fechaPublicacion ? new Date(payload.fechaPublicacion) : new Date();
    const publicada = payload.estado === 'publicada';
    const [result] = await pool.execute(
      `UPDATE noticias
       SET titulo = ?, descripcion = ?, categoria = ?, imagen_url = ?, publicada = ?, creado_en = ?
       WHERE id = ?`,
      [payload.titulo, payload.descripcion, payload.categoria, payload.imagenUrl || null, publicada, fecha, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Noticia no encontrada.' });
    return res.json({ message: 'Noticia actualizada correctamente.' });
  } catch (error) {
    console.error('[noticias:actualizar]', error);
    return res.status(500).json({ message: 'No se pudo actualizar la noticia.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM noticias WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Noticia no encontrada.' });
    return res.json({ message: 'Noticia eliminada correctamente.' });
  } catch (error) {
    console.error('[noticias:eliminar]', error);
    return res.status(500).json({ message: 'No se pudo eliminar la noticia.' });
  }
});

module.exports = router;
