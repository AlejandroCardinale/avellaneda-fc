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

function parseLines(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(s => String(s).trim()).filter(Boolean);
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
      } catch {}
    }
    return trimmed.split('\n').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function parseSpecs(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map(item => {
      if (typeof item === 'object' && item !== null && item.key) return item;
      const str = String(item).trim();
      const colonIdx = str.indexOf(':');
      if (colonIdx !== -1) {
        return { key: str.slice(0, colonIdx).trim(), value: str.slice(colonIdx + 1).trim() };
      }
      return { key: 'Detalle', value: str };
    }).filter(s => s.key || s.value);
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseSpecs(parsed);
      } catch {}
    }
    return trimmed
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const colonIdx = line.indexOf(':');
        if (colonIdx !== -1) {
          return { key: line.slice(0, colonIdx).trim(), value: line.slice(colonIdx + 1).trim() };
        }
        return { key: 'Detalle', value: line };
      });
  }
  return [];
}

function formatFacility(f) {
  const features = parseLines(f.caracteristicas);
  const technicalSpecs = parseSpecs(f.especificaciones_tecnicas);
  const regulations = parseLines(f.normativas);
  const equipment = parseLines(f.equipamiento);

  return {
    id: Number(f.id),
    name: f.nombre,
    nombre: f.nombre,
    description: f.descripcion,
    descripcion: f.descripcion,
    longDescription: f.descripcion_larga || f.descripcion,
    descripcion_larga: f.descripcion_larga || f.descripcion,
    image: f.imagen_url || 'images/football_pitch.png',
    imagen_url: f.imagen_url || 'images/football_pitch.png',
    icon: f.icono || 'fa-building',
    icono: f.icono || 'fa-building',
    label: f.tipo || 'Deportiva',
    tipo: f.tipo || 'Deportiva',
    capacidad: Number(f.capacidad || 0),
    schedule: f.horario || '',
    horario: f.horario || '',
    features,
    caracteristicas: features,
    technicalSpecs,
    especificaciones_tecnicas: technicalSpecs,
    regulations,
    normativas: regulations,
    equipment,
    equipamiento: equipment,
    activa: Boolean(f.activa)
  };
}

function validateFacility(body) {
  const nombre = String(body.nombre || body.name || '').trim();
  const descripcion = String(body.descripcion || body.description || '').trim();
  const tipo = String(body.tipo || body.label || 'Deportiva').trim();
  const icono = String(body.icono || body.icon || 'fa-building').trim();
  const capacidad = Number(body.capacidad) || 0;
  const horario = String(body.horario || body.schedule || '').trim();
  const descripcionLarga = String(body.descripcion_larga || body.longDescription || descripcion).trim();
  const activa = !(body.activa === false || body.activa === 'false' || body.activa === '0');

  if (!nombre) return { error: 'El nombre de la instalación es obligatorio.' };
  if (!descripcion) return { error: 'La descripción es obligatoria.' };

  const caracteristicas = parseLines(body.caracteristicas);
  const especificaciones = parseSpecs(body.especificaciones_tecnicas);
  const normativas = parseLines(body.normativas);
  const equipamiento = parseLines(body.equipamiento);

  return {
    nombre,
    descripcion,
    descripcion_larga: descripcionLarga,
    tipo,
    icono,
    capacidad,
    horario,
    caracteristicas: JSON.stringify(caracteristicas),
    especificaciones_tecnicas: JSON.stringify(especificaciones),
    normativas: JSON.stringify(normativas),
    equipamiento: JSON.stringify(equipamiento),
    activa
  };
}

// GET /api/instalaciones (Público y Admin)
router.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const tipo = String(req.query.tipo || '').trim();
    const activoParam = req.query.activa;

    const filters = ['1 = 1'];
    const params = [];

    if (activoParam !== 'todos') {
      filters.push('activa = TRUE');
    }

    if (search) {
      filters.push('(nombre LIKE ? OR descripcion LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (tipo && tipo !== 'todas') {
      filters.push('tipo = ?');
      params.push(tipo);
    }

    const sql = `
      SELECT id, nombre, descripcion, descripcion_larga, icono, imagen_url,
             capacidad, tipo, horario, caracteristicas, especificaciones_tecnicas,
             normativas, equipamiento, activa
      FROM instalaciones
      WHERE ${filters.join(' AND ')}
      ORDER BY id ASC
    `;

    const [rows] = await pool.execute(sql, params);
    const data = rows.map(formatFacility);
    return res.json(data);
  } catch (error) {
    console.error('[instalaciones GET]', error);
    return res.status(500).json({ message: 'No se pudieron cargar las instalaciones.' });
  }
});

// GET /api/instalaciones/:id (Público y Admin)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, nombre, descripcion, descripcion_larga, icono, imagen_url,
             capacidad, tipo, horario, caracteristicas, especificaciones_tecnicas,
             normativas, equipamiento, activa
      FROM instalaciones
      WHERE id = ?
      LIMIT 1
    `, [req.params.id]);

    if (!rows.length) {
      return res.status(404).json({ message: 'Instalación no encontrada.' });
    }

    return res.json(formatFacility(rows[0]));
  } catch (error) {
    console.error('[instalaciones GET :id]', error);
    return res.status(500).json({ message: 'No se pudo cargar la instalación.' });
  }
});

// POST /api/instalaciones (Admin)
router.post('/', auth, requireAdmin, uploadImage.single('imagen'), async (req, res) => {
  try {
    const body = req.file
      ? { ...req.body, imagen_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` }
      : req.body;

    const valid = validateFacility(body);
    if (valid.error) return res.status(400).json({ message: valid.error });

    const sql = `
      INSERT INTO instalaciones (
        nombre, descripcion, descripcion_larga, icono, imagen_url,
        capacidad, tipo, horario, caracteristicas, especificaciones_tecnicas,
        normativas, equipamiento, activa
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
      valid.nombre,
      valid.descripcion,
      valid.descripcion_larga,
      valid.icono,
      body.imagen_url || 'images/football_pitch.png',
      valid.capacidad,
      valid.tipo,
      valid.horario,
      valid.caracteristicas,
      valid.especificaciones_tecnicas,
      valid.normativas,
      valid.equipamiento,
      valid.activa
    ]);

    return res.status(201).json({
      message: 'Instalación registrada correctamente.',
      id: result.insertId
    });
  } catch (error) {
    console.error('[instalaciones POST]', error);
    return res.status(500).json({ message: 'No se pudo registrar la instalación.' });
  }
});

// PUT /api/instalaciones/:id (Admin)
router.put('/:id', auth, requireAdmin, uploadImage.single('imagen'), async (req, res) => {
  try {
    const body = req.file
      ? { ...req.body, imagen_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` }
      : req.body;

    const valid = validateFacility(body);
    if (valid.error) return res.status(400).json({ message: valid.error });

    const sql = `
      UPDATE instalaciones
      SET nombre = ?,
          descripcion = ?,
          descripcion_larga = ?,
          icono = ?,
          imagen_url = COALESCE(?, imagen_url),
          capacidad = ?,
          tipo = ?,
          horario = ?,
          caracteristicas = ?,
          especificaciones_tecnicas = ?,
          normativas = ?,
          equipamiento = ?,
          activa = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(sql, [
      valid.nombre,
      valid.descripcion,
      valid.descripcion_larga,
      valid.icono,
      body.imagen_url || null,
      valid.capacidad,
      valid.tipo,
      valid.horario,
      valid.caracteristicas,
      valid.especificaciones_tecnicas,
      valid.normativas,
      valid.equipamiento,
      valid.activa,
      req.params.id
    ]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Instalación no encontrada.' });
    }

    return res.json({ message: 'Instalación actualizada correctamente.' });
  } catch (error) {
    console.error('[instalaciones PUT]', error);
    return res.status(500).json({ message: 'No se pudo actualizar la instalación.' });
  }
});

// DELETE /api/instalaciones/:id (Admin)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'UPDATE instalaciones SET activa = FALSE WHERE id = ?',
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Instalación no encontrada.' });
    }

    return res.json({ message: 'Instalación desactivada correctamente.' });
  } catch (error) {
    console.error('[instalaciones DELETE]', error);
    return res.status(500).json({ message: 'No se pudo eliminar la instalación.' });
  }
});

module.exports = router;
