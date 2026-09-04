const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/require-admin');

const router = express.Router();

router.use(auth);
router.use(requireAdmin);

router.get('/dashboard', async (_req, res) => {
  try {
    const [summaryRows] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM atletas) AS total_atletas,
        (SELECT COUNT(*) FROM entrenadores) AS total_entrenadores,
        (SELECT COUNT(*) FROM solicitudes WHERE estado = 'pendiente') AS solicitudes_pendientes,
        (SELECT COUNT(*) FROM instalaciones WHERE activa = TRUE) AS recursos_disponibles
    `);

    const summary = summaryRows[0] || {
      total_atletas: 0,
      total_entrenadores: 0,
      solicitudes_pendientes: 0,
      recursos_disponibles: 0
    };

    const [noticias] = await pool.execute(`
      SELECT
        id,
        titulo,
        descripcion,
        categoria,
        DATE_FORMAT(creado_en, '%d %b %Y') AS fecha_formateada
      FROM noticias
      WHERE publicada = TRUE
      ORDER BY creado_en DESC
      LIMIT 3
    `);

    const [solicitudes] = await pool.execute(`
      SELECT
        s.id,
        s.tipo,
        s.estado,
        s.fecha_necesidad,
        CONCAT(u.nombre, ' ', u.apellido) AS solicitante,
        s.creado_en
      FROM solicitudes s
      JOIN usuarios u ON u.id = s.usuario_id
      ORDER BY s.creado_en DESC
      LIMIT 5
    `);

    const [actividad] = await pool.execute(`
      SELECT
        tipo,
        texto,
        minutos_antes
      FROM (
        SELECT
          'noticia' AS tipo,
          titulo AS texto,
          TIMESTAMPDIFF(MINUTE, creado_en, NOW()) AS minutos_antes,
          creado_en
        FROM noticias

        UNION ALL

        SELECT
          'solicitud' AS tipo,
          CONCAT('Solicitud ', tipo, ' ', estado) AS texto,
          TIMESTAMPDIFF(MINUTE, creado_en, NOW()) AS minutos_antes,
          creado_en
        FROM solicitudes
      ) AS log_actividad
      ORDER BY creado_en DESC
      LIMIT 6
    `);

    const [chartRows] = await pool.execute(`
      SELECT
        DATE_FORMAT(fecha, '%b') AS mes,
        SUM(total) AS total
      FROM (
        SELECT DATE_FORMAT(creado_en, '%Y-%m-01') AS fecha, 1 AS total FROM usuarios
        UNION ALL
        SELECT DATE_FORMAT(creado_en, '%Y-%m-01'), 1 FROM noticias
        UNION ALL
        SELECT DATE_FORMAT(creado_en, '%Y-%m-01'), 1 FROM eventos
        UNION ALL
        SELECT DATE_FORMAT(creado_en, '%Y-%m-01'), 1 FROM solicitudes
      ) t
      GROUP BY DATE_FORMAT(fecha, '%Y-%m')
      ORDER BY fecha ASC
      LIMIT 12
    `);

    const respuesta = {
      summary: {
        totalAtletas: Number(summary.total_atletas || 0),
        totalEntrenadores: Number(summary.total_entrenadores || 0),
        solicitudesPendientes: Number(summary.solicitudes_pendientes || 0),
        recursosDisponibles: Number(summary.recursos_disponibles || 0)
      },
      noticias: noticias.map(n => ({
        id: n.id,
        titulo: n.titulo,
        descripcion: n.descripcion,
        categoria: n.categoria,
        fecha: n.fecha_formateada
      })),
      solicitudes: solicitudes.map(s => ({
        id: s.id,
        tipo: s.tipo,
        estado: s.estado,
        fecha: s.fecha_necesidad,
        solicitante: s.solicitante,
        creado: s.creado_en
      })),
      actividad: actividad.map(item => ({
        tipo: item.tipo,
        texto: item.texto,
        minutos_antes: Number(item.minutos_antes || 0)
      })),
      chart: chartRows.map(row => ({
        mes: row.mes,
        total: Number(row.total || 0)
      }))
    };

    return res.json(respuesta);
  } catch (error) {
    console.error('[admin dashboard]', error);
    return res.status(500).json({ message: 'Error cargando el dashboard administrativo.' });
  }
});

module.exports = router;
