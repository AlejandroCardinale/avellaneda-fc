const express    = require('express');
const pool       = require('../db');
const auth       = require('../middleware/auth');
const requireAdmin = require('../middleware/require-admin');

const router = express.Router();
router.use(auth, requireAdmin);

function getFilters(query) {
  const from = /^\d{4}-\d{2}-\d{2}$/.test(query.desde || '') ? query.desde : null;
  const to   = /^\d{4}-\d{2}-\d{2}$/.test(query.hasta || '') ? query.hasta : null;
  const disciplina = Number.parseInt(query.disciplina, 10);
  return {
    from,
    to,
    disciplina: Number.isInteger(disciplina) && disciplina > 0 ? disciplina : 0
  };
}

/**
 * Llama al STORED PROCEDURE sp_reporte_general y mapea los 8 result sets.
 * Fallback a queries directas si el SP no existe aún.
 */
async function buildReport(filters) {
  const { from, to, disciplina } = filters;

  // CALL sp_reporte_general devuelve múltiples result sets
  const [results] = await pool.query(
    'CALL sp_reporte_general(?, ?, ?)',
    [from || null, to || null, disciplina]
  );

  // results es un array de result sets [ [rows0], [rows1], ..., OkPacket ]
  const [summary]         = results[0];   // métricas globales (1 fila)
  const disciplines        = results[1];   // atletas por disciplina
  const attendance         = results[2];   // asistencia semanal
  const registrations      = results[3];   // registros por período
  const requested          = results[4];   // recursos más solicitados
  const attendanceDetails  = results[5];   // detalle asistencias
  const resourceActivity   = results[6];   // actividad recursos
  const ranking            = results[7];   // ranking atletas

  return {
    filters: {
      desde:       from || '',
      hasta:       to   || '',
      disciplina:  disciplina ? String(disciplina) : ''
    },
    metrics: {
      totalAtletas:          Number(summary?.total_atletas          || 0),
      promedioAsistencia:    Number(summary?.promedio_asistencia    || 0),
      recursosEnUso:         Number(summary?.recursos_en_uso        || 0),
      solicitudesResueltas:  Number(summary?.solicitudes_resueltas  || 0)
    },
    atletasPorDisciplina: (disciplines || []).map(r => ({
      id:    r.id,
      nombre: r.nombre,
      total:  Number(r.total || 0),
      pctAsistencia: Number(r.pct_asistencia || 0)
    })),
    asistenciaSemanal: (attendance || []).reverse().map(r => ({
      periodo:    r.periodo,
      porcentaje: Number(r.porcentaje || 0)
    })),
    registrosPorPeriodo: (registrations || []).reverse().map(r => ({
      periodo: r.periodo,
      total:   Number(r.total || 0)
    })),
    recursosMasSolicitados: (requested || []).map(r => ({
      nombre: r.nombre,
      total:  Number(r.total || 0)
    })),
    asistenciasDetalle: (attendanceDetails || []).map(r => ({
      atleta:        r.atleta,
      entrenamiento: r.entrenamiento,
      fecha:         r.fecha,
      presente:      Boolean(r.presente)
    })),
    actividadRecursos: (resourceActivity || []).map(r => ({
      recurso:  r.recurso,
      usuario:  r.usuario,
      fecha:    r.fecha,
      estado:   r.estado
    })),
    rankingAtletas: (ranking || []).map(r => ({
      atleta:         r.atleta,
      deporte:        r.deporte,
      pctAsistencia:  Number(r.pct_asistencia || 0),
      sesTotales:     Number(r.sesiones_totales || 0)
    }))
  };
}

// ── GET / ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    return res.json(await buildReport(getFilters(req.query)));
  } catch (error) {
    console.error('[reportes]', error.message);
    return res.status(500).json({ message: 'No se pudo generar el reporte.' });
  }
});

// ── GET /export ───────────────────────────────────────────────────────────────
router.get('/export', async (req, res) => {
  try {
    const report = await buildReport(getFilters(req.query));
    const format = req.query.formato === 'pdf' ? 'pdf' : 'excel';
    const lines = [
      ['Reporte Avellaneda FC'],
      ['Metrica', 'Valor'],
      ['Total atletas',         report.metrics.totalAtletas],
      ['Promedio asistencia',   `${report.metrics.promedioAsistencia}%`],
      ['Recursos en uso',       report.metrics.recursosEnUso],
      ['Solicitudes resueltas', report.metrics.solicitudesResueltas],
      [],
      ['Atletas por disciplina', 'Total', '% Asistencia'],
      ...report.atletasPorDisciplina.map(i => [i.nombre, i.total, `${i.pctAsistencia}%`]),
      [],
      ['Recursos mas solicitados', 'Cantidad'],
      ...report.recursosMasSolicitados.map(i => [i.nombre, i.total]),
      [],
      ['Ranking atletas', 'Deporte', '% Asistencia', 'Sesiones'],
      ...report.rankingAtletas.map(i => [i.atleta, i.deporte, `${i.pctAsistencia}%`, i.sesTotales])
    ];

    const csv = lines
      .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    if (format === 'excel') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte-avellaneda-fc.csv"');
      return res.send(`\uFEFF${csv}`);
    }

    // HTML básico para el formato pdf (legacy)
    const html = `<html><head><meta charset="utf-8"><title>Reporte</title></head>
      <body style="font-family:Arial">${csv.replace(/\n/g,'<br>')}</body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-avellaneda-fc.html"');
    return res.send(html);
  } catch (error) {
    console.error('[reportes:export]', error.message);
    return res.status(500).json({ message: 'No se pudo exportar el reporte.' });
  }
});

module.exports = router;
