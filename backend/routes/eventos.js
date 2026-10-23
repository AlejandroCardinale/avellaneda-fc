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
    filename: (_req, file, callback) => callback(null, `evento-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, file.mimetype.startsWith('image/'))
});

const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const MONTHS_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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

function parseSchedule(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map(item => {
      if (typeof item === 'object' && item !== null && item.time && item.activity) {
        return { time: String(item.time).trim(), activity: String(item.activity).trim() };
      }
      const str = String(item).trim();
      const match = str.match(/^(\d{1,2}:\d{2})\s*[-:]\s*(.+)$/);
      if (match) {
        return { time: match[1], activity: match[2].trim() };
      }
      return { time: '', activity: str };
    }).filter(i => i.activity || i.time);
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseSchedule(parsed);
      } catch {}
    }
    return trimmed
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const match = line.match(/^(\d{1,2}:\d{2})\s*[-:]\s*(.+)$/);
        if (match) {
          return { time: match[1], activity: match[2].trim() };
        }
        return { time: '', activity: line };
      });
  }
  return [];
}

function formatEvent(row) {
  let isoDate = '';
  let day = '01';
  let month = 'ENE';
  let formattedDate = '';
  let timeStr = '19:00 hs';
  let rawFechaHora = '';

  if (row.fecha_hora_str) {
    rawFechaHora = row.fecha_hora_str;
    const parts = row.fecha_hora_str.split(' ');
    isoDate = parts[0];
    const ymd = parts[0].split('-');
    if (ymd.length === 3) {
      const year = ymd[0];
      const monthIdx = parseInt(ymd[1], 10) - 1;
      day = ymd[2].padStart(2, '0');
      month = MONTHS_SHORT[monthIdx] || 'ENE';
      formattedDate = `${parseInt(day, 10)} ${MONTHS_NAMES[monthIdx] || ''} ${year}`;
    }
    if (parts[1]) {
      const hm = parts[1].slice(0, 5);
      timeStr = `${hm} hs`;
    }
  } else if (row.fecha_hora) {
    const d = new Date(row.fecha_hora);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      day = String(d.getDate()).padStart(2, '0');
      month = MONTHS_SHORT[monthIdx] || 'ENE';
      isoDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${day}`;
      formattedDate = `${parseInt(day, 10)} ${MONTHS_NAMES[monthIdx] || ''} ${year}`;
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      timeStr = `${hours}:${minutes} hs`;
      rawFechaHora = `${isoDate} ${hours}:${minutes}:00`;
    }
  }

  const schedule = parseSchedule(row.cronograma);
  const categories = parseLines(row.categorias_participantes);
  const rules = parseLines(row.reglas);
  const prizes = parseLines(row.premios);

  const inscription = {
    open: Boolean(row.inscripcion_abierta),
    deadline: row.inscripcion_limite || '',
    contact: row.inscripcion_contacto || ''
  };

  return {
    id: Number(row.id),
    title: row.titulo,
    titulo: row.titulo,
    description: row.descripcion || '',
    descripcion: row.descripcion || '',
    longDescription: row.descripcion_larga || row.descripcion || '',
    descripcion_larga: row.descripcion_larga || row.descripcion || '',
    date: formattedDate,
    isoDate,
    day,
    month,
    year: (isoDate && isoDate.split('-')[0]) || '2026',
    time: timeStr,
    fecha_hora: rawFechaHora,
    endTime: row.hora_fin || '',
    hora_fin: row.hora_fin || '',
    location: row.lugar || '',
    lugar: row.lugar || '',
    locationDetail: row.lugar_detalle || '',
    lugar_detalle: row.lugar_detalle || '',
    discipline: row.disciplina || 'General',
    disciplina: row.disciplina || 'General',
    category: row.categoria || 'Sociales',
    categoria: row.categoria || 'Sociales',
    image: row.imagen_url || 'images/football_pitch.png',
    imagen_url: row.imagen_url || 'images/football_pitch.png',
    schedule,
    cronograma: schedule,
    categories,
    categorias_participantes: categories,
    inscription,
    inscripcion_abierta: Boolean(row.inscripcion_abierta),
    inscripcion_limite: row.inscripcion_limite || '',
    inscripcion_contacto: row.inscripcion_contacto || '',
    rules,
    reglas: rules,
    prizes,
    premios: prizes,
    publicado: Boolean(row.publicado),
    destacado: Boolean(row.destacado)
  };
}

function normalizeDateInput(fechaInput, horaInput) {
  if (!fechaInput) return null;
  let str = String(fechaInput).trim();
  if (str.includes('T')) {
    str = str.replace('T', ' ');
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const timePart = horaInput ? horaInput.replace(' hs', '').trim() : '19:00';
    return `${str} ${timePart.length === 5 ? timePart + ':00' : timePart}`;
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(str)) {
    return `${str}:00`;
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
    return str;
  }
  return str;
}

function validateEvent(body) {
  const titulo = String(body.titulo || body.title || '').trim();
  const descripcion = String(body.descripcion || body.description || '').trim();
  const descripcionLarga = String(body.descripcion_larga || body.longDescription || descripcion).trim();
  const lugar = String(body.lugar || body.location || '').trim();
  const lugarDetalle = String(body.lugar_detalle || body.locationDetail || '').trim();
  const disciplina = String(body.disciplina || body.discipline || 'Social').trim();
  const categoria = String(body.categoria || body.category || 'Sociales').trim();
  const horaFin = String(body.hora_fin || body.endTime || '').trim();

  let rawFecha = body.fecha_hora || body.isoDate || body.date || body.fecha;
  const fechaHora = normalizeDateInput(rawFecha, body.hora_fin || body.time || body.hora);

  if (!titulo) return { error: 'El título del evento es obligatorio.' };
  if (!descripcion) return { error: 'La descripción del evento es obligatoria.' };
  if (!fechaHora) return { error: 'La fecha y hora del evento es obligatoria.' };

  const cronograma = parseSchedule(body.cronograma || body.schedule);
  const categorias = parseLines(body.categorias_participantes || body.categories);
  const reglas = parseLines(body.reglas || body.rules);
  const premios = parseLines(body.premios || body.prizes);

  let inscripcionAbierta = true;
  if (body.inscripcion_abierta !== undefined) {
    inscripcionAbierta = !(body.inscripcion_abierta === false || body.inscripcion_abierta === 'false' || body.inscripcion_abierta === '0' || body.inscripcion_abierta === 0);
  } else if (body.inscription && body.inscription.open !== undefined) {
    inscripcionAbierta = Boolean(body.inscription.open);
  }

  const inscripcionLimite = String(body.inscripcion_limite || (body.inscription ? body.inscription.deadline : '') || '').trim();
  const inscripcionContacto = String(body.inscripcion_contacto || (body.inscription ? body.inscription.contact : '') || '').trim();

  const publicado = !(body.publicado === false || body.publicado === 'false' || body.publicado === '0' || body.publicado === 0);
  const destacado = (body.destacado === true || body.destacado === 'true' || body.destacado === '1' || body.destacado === 1);

  return {
    titulo,
    descripcion,
    descripcion_larga: descripcionLarga,
    fecha_hora: fechaHora,
    hora_fin: horaFin,
    lugar,
    lugar_detalle: lugarDetalle,
    disciplina,
    categoria,
    cronograma: JSON.stringify(cronograma),
    categorias_participantes: JSON.stringify(categorias),
    inscripcion_abierta: inscripcionAbierta ? 1 : 0,
    inscripcion_limite: inscripcionLimite,
    inscripcion_contacto: inscripcionContacto,
    reglas: JSON.stringify(reglas),
    premios: JSON.stringify(premios),
    publicado: publicado ? 1 : 0,
    destacado: destacado ? 1 : 0
  };
}

// ── GET /api/eventos (Público y Admin) ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const categoria = String(req.query.categoria || req.query.category || '').trim();
    const publicadoParam = req.query.publicado;

    const filters = ['1 = 1'];
    const params = [];

    if (publicadoParam === 'todos' || publicadoParam === 'all') {
      // Panel de administración: mostrar publicados y borradores
    } else if (publicadoParam === '0' || publicadoParam === 'false') {
      filters.push('publicado = 0');
    } else {
      // Vistas públicas por defecto: solo eventos publicados
      filters.push('publicado = 1');
    }

    if (search) {
      filters.push('(titulo LIKE ? OR descripcion LIKE ? OR lugar LIKE ? OR disciplina LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (categoria) {
      const catNorm = categoria.toLowerCase().trim();
      const ignoredCategories = ['todos', 'todas', 'todos los eventos', 'todas las categorías', 'todas las categorias'];
      if (!ignoredCategories.includes(catNorm)) {
        filters.push('categoria = ?');
        params.push(categoria);
      }
    }

    const sql = `
      SELECT id, titulo, descripcion, descripcion_larga,
             DATE_FORMAT(fecha_hora, '%Y-%m-%d %H:%i:%s') AS fecha_hora_str,
             hora_fin, lugar, lugar_detalle, disciplina, categoria, imagen_url,
             cronograma, categorias_participantes, inscripcion_abierta,
             inscripcion_limite, inscripcion_contacto, reglas, premios,
             publicado, destacado
      FROM eventos
      WHERE ${filters.join(' AND ')}
      ORDER BY fecha_hora ASC
    `;

    const [rows] = await pool.execute(sql, params);
    const data = rows.map(formatEvent);
    return res.json(data);
  } catch (error) {
    console.error('[eventos GET]', error);
    return res.status(500).json({ message: 'No se pudieron cargar los eventos.' });
  }
});

// ── GET /api/eventos/:id (Público y Admin) ──────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT id, titulo, descripcion, descripcion_larga,
             DATE_FORMAT(fecha_hora, '%Y-%m-%d %H:%i:%s') AS fecha_hora_str,
             hora_fin, lugar, lugar_detalle, disciplina, categoria, imagen_url,
             cronograma, categorias_participantes, inscripcion_abierta,
             inscripcion_limite, inscripcion_contacto, reglas, premios,
             publicado, destacado
      FROM eventos
      WHERE id = ?
      LIMIT 1
    `, [req.params.id]);

    if (!rows.length) {
      return res.status(404).json({ message: 'Evento no encontrado.' });
    }

    return res.json(formatEvent(rows[0]));
  } catch (error) {
    console.error('[eventos GET :id]', error);
    return res.status(500).json({ message: 'No se pudo cargar el evento.' });
  }
});

// ── POST /api/eventos (Admin) ───────────────────────────────────────────────
router.post('/', auth, requireAdmin, uploadImage.single('imagen'), async (req, res) => {
  try {
    const body = req.file
      ? { ...req.body, imagen_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` }
      : req.body;

    const valid = validateEvent(body);
    if (valid.error) return res.status(400).json({ message: valid.error });

    const imagenUrl = body.imagen_url || 'images/football_pitch.png';
    const creadoPor = req.usuario?.id || req.user?.id || 1;

    const sql = `
      INSERT INTO eventos (
        titulo, descripcion, descripcion_larga, fecha_hora, hora_fin,
        lugar, lugar_detalle, disciplina, categoria, imagen_url,
        cronograma, categorias_participantes, inscripcion_abierta,
        inscripcion_limite, inscripcion_contacto, reglas, premios,
        publicado, destacado, creado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
      valid.titulo,
      valid.descripcion,
      valid.descripcion_larga,
      valid.fecha_hora,
      valid.hora_fin,
      valid.lugar,
      valid.lugar_detalle,
      valid.disciplina,
      valid.categoria,
      imagenUrl,
      valid.cronograma,
      valid.categorias_participantes,
      valid.inscripcion_abierta,
      valid.inscripcion_limite,
      valid.inscripcion_contacto,
      valid.reglas,
      valid.premios,
      valid.publicado,
      valid.destacado,
      creadoPor
    ]);

    return res.status(201).json({
      message: 'Evento creado exitosamente.',
      id: result.insertId
    });
  } catch (error) {
    console.error('[eventos POST]', error);
    return res.status(500).json({ message: 'No se pudo registrar el evento.' });
  }
});

// ── PUT /api/eventos/:id (Admin) ────────────────────────────────────────────
router.put('/:id', auth, requireAdmin, uploadImage.single('imagen'), async (req, res) => {
  try {
    const body = req.file
      ? { ...req.body, imagen_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` }
      : req.body;

    const valid = validateEvent(body);
    if (valid.error) return res.status(400).json({ message: valid.error });

    const [check] = await pool.execute('SELECT id FROM eventos WHERE id = ?', [req.params.id]);
    if (!check.length) {
      return res.status(404).json({ message: 'Evento no encontrado.' });
    }

    const sql = `
      UPDATE eventos
      SET titulo = ?,
          descripcion = ?,
          descripcion_larga = ?,
          fecha_hora = ?,
          hora_fin = ?,
          lugar = ?,
          lugar_detalle = ?,
          disciplina = ?,
          categoria = ?,
          imagen_url = COALESCE(?, imagen_url),
          cronograma = ?,
          categorias_participantes = ?,
          inscripcion_abierta = ?,
          inscripcion_limite = ?,
          inscripcion_contacto = ?,
          reglas = ?,
          premios = ?,
          publicado = ?,
          destacado = ?
      WHERE id = ?
    `;

    await pool.execute(sql, [
      valid.titulo,
      valid.descripcion,
      valid.descripcion_larga,
      valid.fecha_hora,
      valid.hora_fin,
      valid.lugar,
      valid.lugar_detalle,
      valid.disciplina,
      valid.categoria,
      body.imagen_url || null,
      valid.cronograma,
      valid.categorias_participantes,
      valid.inscripcion_abierta,
      valid.inscripcion_limite,
      valid.inscripcion_contacto,
      valid.reglas,
      valid.premios,
      valid.publicado,
      valid.destacado,
      req.params.id
    ]);

    return res.json({ message: 'Evento actualizado exitosamente.' });
  } catch (error) {
    console.error('[eventos PUT]', error);
    return res.status(500).json({ message: 'No se pudo actualizar el evento.' });
  }
});

// ── DELETE /api/eventos/:id (Admin) ─────────────────────────────────────────
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM eventos WHERE id = ?', [req.params.id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Evento no encontrado.' });
    }

    return res.json({ message: 'Evento eliminado exitosamente.' });
  } catch (error) {
    console.error('[eventos DELETE]', error);
    return res.status(500).json({ message: 'No se pudo eliminar el evento.' });
  }
});

module.exports = router;
