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

function formatSport(d) {
  const features = parseLines(d.caracteristicas);
  const categories = parseLines(d.categorias);
  const technicalSpecs = parseSpecs(d.especificaciones_tecnicas);
  const equipment = parseLines(d.equipamiento);
  const regulations = parseLines(d.normativas);

  const realAtletas = Number(d.real_atletas || 0);
  const realEntrenadores = Number(d.real_entrenadores || 0);
  const atletasCount = Math.max(Number(d.atletas_count || 0), realAtletas);
  const entrenadoresCount = Math.max(Number(d.entrenadores_count || 0), realEntrenadores);

  return {
    id: Number(d.id),
    name: d.nombre,
    nombre: d.nombre,
    tipo: d.tipo || 'Deportes',
    label: d.tipo || 'Deportes',
    capacidad: Number(d.capacidad || 0),
    description: d.descripcion,
    descripcion: d.descripcion,
    longDescription: d.descripcion_larga || d.descripcion,
    descripcion_larga: d.descripcion_larga || d.descripcion,
    image: d.imagen_url || 'images/football_pitch.png',
    imagen_url: d.imagen_url || 'images/football_pitch.png',
    icon: d.icono || 'fa-futbol',
    icono: d.icono || 'fa-futbol',
    athletes: atletasCount,
    atletas: atletasCount,
    atletas_count: atletasCount,
    coaches: entrenadoresCount,
    entrenadores: entrenadoresCount,
    entrenadores_count: entrenadoresCount,
    schedule: d.horario || '',
    horario: d.horario || '',
    features,
    caracteristicas: features,
    categories,
    categorias: categories,
    technicalSpecs,
    especificaciones_tecnicas: technicalSpecs,
    equipment,
    equipamiento: equipment,
    regulations,
    normativas: regulations,
    categoria: categories.length ? categories.join(', ') : (d.categoria || d.tipo || ''),
    activo: Boolean(d.activo),
    creado_en: d.creado_en
  };
}

function validateSport(body) {
  const nombre = String(body.nombre || body.name || '').trim();
  const descripcion = String(body.descripcion || body.description || '').trim();
  const descripcionLarga = String(body.descripcion_larga || body.longDescription || descripcion).trim();
  const tipo = String(body.tipo || body.categoria || 'Deportes').trim();
  const capacidad = Number(body.capacidad) || 0;
  const icono = String(body.icono || body.icon || 'fa-futbol').trim();
  const horario = String(body.horario || body.schedule || '').trim();
  const atletasCount = Number(body.atletas || body.atletas_count || body.athletes) || 0;
  const entrenadoresCount = Number(body.entrenadores || body.entrenadores_count || body.coaches) || 0;
  const activo = !(body.activo === false || body.activo === 'false' || body.activo === '0');

  if (!nombre) return { error: 'El nombre del deporte es obligatorio.' };
  if (!descripcion) return { error: 'La descripción es obligatoria.' };

  const caracteristicas = parseLines(body.caracteristicas);
  let categorias = parseLines(body.categorias);
  if (!categorias.length && body.categoria) {
    categorias = body.categoria.split(',').map(c => c.trim()).filter(Boolean);
  }

  const especificaciones = parseSpecs(body.especificaciones_tecnicas);
  const equipamiento = parseLines(body.equipamiento);
  const normativas = parseLines(body.normativas);

  return {
    nombre,
    descripcion,
    descripcion_larga: descripcionLarga,
    tipo,
    capacidad,
    icono,
    horario,
    atletas_count: atletasCount,
    entrenadores_count: entrenadoresCount,
    caracteristicas: JSON.stringify(caracteristicas),
    categorias: JSON.stringify(categorias),
    especificaciones_tecnicas: JSON.stringify(especificaciones),
    equipamiento: JSON.stringify(equipamiento),
    normativas: JSON.stringify(normativas),
    categoriaList: categorias,
    activo
  };
}

// GET /api/deportes (Público y Admin)
router.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const activoParam = req.query.activo;
    const isAdminQuery = activoParam !== undefined;
    const activo = activoParam === 'todos' ? null : (activoParam !== 'false');

    const params = [];
    const filters = ['1 = 1'];

    if (search) {
      filters.push('(d.nombre LIKE ? OR d.descripcion LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (activo !== null && (isAdminQuery || activoParam !== undefined)) {
      filters.push('d.activo = ?');
      params.push(activo);
    } else if (!isAdminQuery) {
      filters.push('d.activo = TRUE');
    }

    const where = filters.join(' AND ');

    const sql = `
      SELECT d.*,
             (SELECT COUNT(*) FROM atletas a WHERE a.deporte_id = d.id) AS real_atletas,
             (SELECT COUNT(*) FROM entrenadores e WHERE e.deporte_id = d.id) AS real_entrenadores
      FROM deportes d
      WHERE ${where}
      ORDER BY d.id ASC
    `;

    const [rows] = await pool.execute(sql, params);
    const data = rows.map(formatSport);

    if (isAdminQuery) {
      return res.json({ data, total: data.length });
    }

    return res.json(data);
  } catch (error) {
    console.error('[deportes GET]', error);
    return res.status(500).json({ message: 'No se pudieron cargar los deportes.' });
  }
});

// GET /api/deportes/:id (Público y Admin)
router.get('/:id', async (req, res) => {
  try {
    const sql = `
      SELECT d.*,
             (SELECT COUNT(*) FROM atletas a WHERE a.deporte_id = d.id) AS real_atletas,
             (SELECT COUNT(*) FROM entrenadores e WHERE e.deporte_id = d.id) AS real_entrenadores
      FROM deportes d
      WHERE d.id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(sql, [req.params.id]);

    if (!rows.length) {
      return res.status(404).json({ message: 'Deporte no encontrado.' });
    }

    return res.json(formatSport(rows[0]));
  } catch (error) {
    console.error('[deportes GET :id]', error);
    return res.status(500).json({ message: 'No se pudo cargar el deporte.' });
  }
});

// ── Rutas administrativas protegidas ──────────────────────────────────────────

// POST /api/deportes
router.post('/', auth, requireAdmin, uploadImage.single('imagen'), async (req, res) => {
  const body = req.file
    ? { ...req.body, imagen_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` }
    : req.body;

  const valid = validateSport(body);
  if (valid.error) return res.status(400).json({ message: valid.error });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO deportes (
        nombre, tipo, capacidad, descripcion, descripcion_larga, icono,
        imagen_url, atletas_count, entrenadores_count, horario,
        caracteristicas, categorias, especificaciones_tecnicas,
        equipamiento, normativas, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        valid.nombre,
        valid.tipo,
        valid.capacidad,
        valid.descripcion,
        valid.descripcion_larga,
        valid.icono,
        body.imagen_url || 'images/football_pitch.png',
        valid.atletas_count,
        valid.entrenadores_count,
        valid.horario,
        valid.caracteristicas,
        valid.categorias,
        valid.especificaciones_tecnicas,
        valid.equipamiento,
        valid.normativas,
        valid.activo
      ]
    );

    if (valid.categoriaList && valid.categoriaList.length > 0) {
      for (const cat of valid.categoriaList) {
        await connection.execute(
          'INSERT INTO categorias (deporte_id, nombre) VALUES (?, ?)',
          [result.insertId, cat]
        );
      }
    }

    await connection.commit();
    return res.status(201).json({ message: 'Deporte creado correctamente.', id: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('[deportes POST]', error);
    return res.status(500).json({ message: 'No se pudo crear el deporte.' });
  } finally {
    connection.release();
  }
});

// PUT /api/deportes/:id
router.put('/:id', auth, requireAdmin, uploadImage.single('imagen'), async (req, res) => {
  const body = req.file
    ? { ...req.body, imagen_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` }
    : req.body;

  const valid = validateSport(body);
  if (valid.error) return res.status(400).json({ message: valid.error });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `UPDATE deportes
       SET nombre = ?,
           tipo = ?,
           capacidad = ?,
           descripcion = ?,
           descripcion_larga = ?,
           icono = ?,
           imagen_url = COALESCE(?, imagen_url),
           atletas_count = ?,
           entrenadores_count = ?,
           horario = ?,
           caracteristicas = ?,
           categorias = ?,
           especificaciones_tecnicas = ?,
           equipamiento = ?,
           normativas = ?,
           activo = ?
       WHERE id = ?`,
      [
        valid.nombre,
        valid.tipo,
        valid.capacidad,
        valid.descripcion,
        valid.descripcion_larga,
        valid.icono,
        body.imagen_url || null,
        valid.atletas_count,
        valid.entrenadores_count,
        valid.horario,
        valid.caracteristicas,
        valid.categorias,
        valid.especificaciones_tecnicas,
        valid.equipamiento,
        valid.normativas,
        valid.activo,
        req.params.id
      ]
    );

    if (!result.affectedRows) {
      await connection.rollback();
      return res.status(404).json({ message: 'Deporte no encontrado.' });
    }

    if (valid.categoriaList && valid.categoriaList.length > 0) {
      for (const cat of valid.categoriaList) {
        const [catExists] = await connection.execute(
          'SELECT id FROM categorias WHERE deporte_id = ? AND nombre = ?',
          [req.params.id, cat]
        );
        if (!catExists.length) {
          await connection.execute(
            'INSERT INTO categorias (deporte_id, nombre) VALUES (?, ?)',
            [req.params.id, cat]
          );
        }
      }
    }

    await connection.commit();
    return res.json({ message: 'Deporte actualizado correctamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('[deportes PUT]', error);
    return res.status(500).json({ message: 'No se pudo actualizar el deporte.' });
  } finally {
    connection.release();
  }
});

// DELETE /api/deportes/:id
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('UPDATE deportes SET activo = FALSE WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Deporte no encontrado.' });
    return res.json({ message: 'Deporte desactivado correctamente.' });
  } catch (error) {
    console.error('[deportes DELETE]', error);
    return res.status(500).json({ message: 'No se pudo eliminar el deporte.' });
  }
});

module.exports = router;
