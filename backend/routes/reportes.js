const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/require-admin');

const router = express.Router();
router.use(auth, requireAdmin);

function getFilters(query) {
  const from = /^\d{4}-\d{2}-\d{2}$/.test(query.desde || '') ? query.desde : null;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(query.hasta || '') ? query.hasta : null;
  const disciplina = Number.parseInt(query.disciplina, 10);
  return { from, to, disciplina: Number.isInteger(disciplina) && disciplina > 0 ? disciplina : null };
}

function whereDate(column, filters, params) {
  const clauses = [];
  if (filters.from) { clauses.push(`${column} >= ?`); params.push(filters.from); }
  if (filters.to) { clauses.push(`${column} < DATE_ADD(?, INTERVAL 1 DAY)`); params.push(filters.to); }
  return clauses;
}

async function buildReport(filters) {
  const athleteParams = [];
  const athleteWhere = ['a.estado_medico <> \'no_apto\''];
  if (filters.disciplina) { athleteWhere.push('a.deporte_id = ?'); athleteParams.push(filters.disciplina); }
  athleteWhere.push(...whereDate('a.fecha_alta', filters, athleteParams));

  const attendanceParams = [];
  const attendanceWhere = ['1 = 1'];
  if (filters.disciplina) { attendanceWhere.push('a.deporte_id = ?'); attendanceParams.push(filters.disciplina); }
  attendanceWhere.push(...whereDate('ae.fecha', filters, attendanceParams));

  const requestParams = [];
  const requestWhere = ["s.estado IN ('aprobada', 'entregada')"];
  requestWhere.push(...whereDate('s.creado_en', filters, requestParams));

  const [[summary]] = await pool.execute(`
    SELECT
      (SELECT COUNT(*) FROM atletas a WHERE ${athleteWhere.join(' AND ')}) AS total_atletas,
      (SELECT COALESCE(ROUND(100 * AVG(ae.presente), 0), 0)
       FROM asistencias_entrenamiento ae JOIN atletas a ON a.id = ae.atleta_id
       WHERE ${attendanceWhere.join(' AND ')}) AS promedio_asistencia,
      (SELECT COALESCE(SUM(si.cantidad), 0)
       FROM solicitud_items si JOIN solicitudes s ON s.id = si.solicitud_id
       WHERE ${requestWhere.join(' AND ')}) AS recursos_en_uso,
      (SELECT COUNT(*) FROM solicitudes s WHERE ${requestWhere.join(' AND ')}) AS solicitudes_resueltas
  `, [...athleteParams, ...attendanceParams, ...requestParams, ...requestParams]);

  const [disciplines] = await pool.execute(`
    SELECT d.id, d.nombre, COUNT(a.id) AS total
    FROM deportes d LEFT JOIN atletas a ON a.deporte_id = d.id AND ${athleteWhere.join(' AND ').replace(/a\.deporte_id = \?/g, 'a.deporte_id = ?')}
    WHERE d.activo = TRUE ${filters.disciplina ? 'AND d.id = ?' : ''}
    GROUP BY d.id, d.nombre ORDER BY total DESC, d.nombre LIMIT 8
  `, filters.disciplina ? [...athleteParams, filters.disciplina] : athleteParams);

  const [requested] = await pool.execute(`
    SELECT ci.nombre, COALESCE(SUM(si.cantidad), 0) AS total
    FROM solicitud_items si JOIN catalogo_items ci ON ci.id = si.item_id
    JOIN solicitudes s ON s.id = si.solicitud_id
    WHERE ${requestWhere.join(' AND ')}
    GROUP BY ci.id, ci.nombre ORDER BY total DESC, ci.nombre LIMIT 5
  `, requestParams);

  const weekParams = [...attendanceParams];
  const [attendance] = await pool.execute(`
    SELECT WEEK(ae.fecha, 1) AS semana, ROUND(100 * AVG(ae.presente), 0) AS porcentaje
    FROM asistencias_entrenamiento ae JOIN atletas a ON a.id = ae.atleta_id
    WHERE ${attendanceWhere.join(' AND ')}
    GROUP BY WEEK(ae.fecha, 1) ORDER BY semana DESC LIMIT 8
  `, weekParams);

  return {
    filters,
    metrics: {
      totalAtletas: Number(summary.total_atletas || 0),
      promedioAsistencia: Number(summary.promedio_asistencia || 0),
      recursosEnUso: Number(summary.recursos_en_uso || 0),
      solicitudesResueltas: Number(summary.solicitudes_resueltas || 0)
    },
    atletasPorDisciplina: disciplines.map(row => ({ id: row.id, nombre: row.nombre, total: Number(row.total || 0) })),
    recursosMasSolicitados: requested.map(row => ({ nombre: row.nombre, total: Number(row.total || 0) })),
    asistenciaSemanal: attendance.reverse().map((row, index) => ({ semana: index + 1, porcentaje: Number(row.porcentaje || 0) }))
  };
}

router.get('/', async (req, res) => {
  try {
    return res.json(await buildReport(getFilters(req.query)));
  } catch (error) {
    console.error('[reportes]', error);
    return res.status(500).json({ message: 'No se pudo generar el reporte. Ejecutá la migración de asistencias.' });
  }
});

router.get('/export', async (req, res) => {
  try {
    const report = await buildReport(getFilters(req.query));
    const format = req.query.formato === 'pdf' ? 'pdf' : 'excel';
    const lines = [
      ['Reporte Avellaneda FC'],
      ['Métrica', 'Valor'],
      ['Total atletas', report.metrics.totalAtletas],
      ['Promedio asistencia', `${report.metrics.promedioAsistencia}%`],
      ['Recursos en uso', report.metrics.recursosEnUso],
      ['Solicitudes resueltas', report.metrics.solicitudesResueltas],
      [], ['Atletas por disciplina', 'Total'],
      ...report.atletasPorDisciplina.map(item => [item.nombre, item.total]),
      [], ['Recursos más solicitados', 'Cantidad'],
      ...report.recursosMasSolicitados.map(item => [item.nombre, item.total])
    ];
    const csv = lines.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    if (format === 'excel') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte-avellaneda-fc.csv"');
      return res.send(`\uFEFF${csv}`);
    }

    const html = `<html><head><meta charset="utf-8"><title>Reporte Avellaneda FC</title><style>body{font-family:Arial;color:#142640;padding:32px}table{border-collapse:collapse;margin:18px 0;width:100%}td,th{border:1px solid #dce5ef;padding:8px;text-align:left}h1{color:#173f76}</style></head><body><h1>Reporte Avellaneda FC</h1><table>${lines.filter(row => row.length).map((row, index) => `<tr>${row.map(cell => `${index === 1 ? '<th>' : '<td>'}${cell}${index === 1 ? '</th>' : '</td>'}`).join('')}</tr>`).join('')}</table></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte-avellaneda-fc.html"');
    return res.send(html);
  } catch (error) {
    console.error('[reportes:export]', error);
    return res.status(500).json({ message: 'No se pudo exportar el reporte.' });
  }
});

module.exports = router;
