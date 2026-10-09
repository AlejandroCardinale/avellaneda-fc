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
        AND creado_en >= NOW() - INTERVAL 7 DAY
      ORDER BY creado_en DESC
      LIMIT 3
    `);

    const [eventos] = await pool.execute(`
      SELECT
        id,
        titulo,
        descripcion,
        fecha_hora,
        lugar,
        disciplina,
        categoria,
        DATE_FORMAT(fecha_hora, '%d %b %Y %H:%i') AS fecha_formateada
      FROM eventos
      WHERE publicado = TRUE
        AND creado_en >= NOW() - INTERVAL 7 DAY
      ORDER BY fecha_hora ASC
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
      eventos: eventos.map(e => ({
        id: e.id,
        titulo: e.titulo,
        descripcion: e.descripcion,
        fecha: e.fecha_formateada,
        fechaHora: e.fecha_hora,
        lugar: e.lugar,
        disciplina: e.disciplina,
        categoria: e.categoria
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

/**
 * GET /api/admin/solicitudes
 * Lista las solicitudes de registro de cuentas. Por defecto ?estado=pendiente.
 * Incluye los datos específicos de atleta o entrenador asociados.
 */
router.get('/solicitudes', async (req, res) => {
  const estado = req.query.estado || 'pendiente';
  try {
    const [rows] = await pool.execute(
      `SELECT
         u.id,
         u.nombre,
         u.apellido,
         u.email,
         u.telefono,
         u.activo,
         u.estado_registro,
         u.creado_en,
         r.nombre AS rol,
         -- Datos de Atleta si aplica
         a.id AS atleta_id,
         a.dni,
         a.numero_socio,
         a.posicion,
         a.deporte_id AS atleta_deporte_id,
         d_a.nombre AS deporte_atleta,
         c.nombre AS categoria,
         -- Datos de Entrenador si aplica
         e.id AS entrenador_id,
         e.especialidad,
         e.licencia,
         e.deporte_id AS entrenador_deporte_id,
         d_e.nombre AS deporte_entrenador,
         -- Nombre de disciplina deportiva unificado
         COALESCE(d_a.nombre, d_e.nombre) AS deporte
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       LEFT JOIN atletas a ON a.usuario_id = u.id
       LEFT JOIN deportes d_a ON d_a.id = a.deporte_id
       LEFT JOIN categorias c ON c.id = a.categoria_id
       LEFT JOIN entrenadores e ON e.usuario_id = u.id
       LEFT JOIN deportes d_e ON d_e.id = e.deporte_id
       WHERE u.estado_registro = ?
       ORDER BY u.creado_en DESC`,
      [estado]
    );

    return res.json(rows);
  } catch (error) {
    console.error('[admin solicitudes GET]', error);
    return res.status(500).json({ message: 'Error al listar las solicitudes de registro.' });
  }
});

/**
 * PUT /api/admin/solicitudes/:id/aprobar y PATCH
 * Aprueba una solicitud de registro: estado_registro = 'aprobado' y activo = TRUE
 * Crea o actualiza simultáneamente el registro en atletas o entrenadores según su rol.
 */
const aprobarSolicitud = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Obtener usuario y su rol
    const [userRows] = await connection.execute(
      `SELECT u.id, u.nombre, u.apellido, u.email, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
       WHERE u.id = ?`,
      [id]
    );

    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const usuario = userRows[0];

    // 2. Si es Atleta, asegurar que exista el registro en la tabla atletas
    if (usuario.rol === 'atleta') {
      const [atletaRows] = await connection.execute(
        'SELECT id FROM atletas WHERE usuario_id = ?',
        [usuario.id]
      );

      if (atletaRows.length === 0) {
        const deporteId = Number(req.body.deporte_id) > 0 ? Number(req.body.deporte_id) : 1;
        const categoriaId = Number(req.body.categoria_id) > 0 ? Number(req.body.categoria_id) : 1;
        const dni = req.body.dni && String(req.body.dni).trim() !== '' ? String(req.body.dni).trim() : null;
        const numeroSocio = req.body.numero_socio && String(req.body.numero_socio).trim() !== '' ? String(req.body.numero_socio).trim() : null;
        const posicion = req.body.posicion && String(req.body.posicion).trim() !== '' ? String(req.body.posicion).trim() : null;

        await connection.execute(
          `INSERT INTO atletas (
            usuario_id, deporte_id, categoria_id, dni, numero_socio, posicion, entrenador_id, estado_medico
          ) VALUES (?, ?, ?, ?, ?, ?, NULL, 'apto')`,
          [usuario.id, deporteId, categoriaId, dni, numeroSocio, posicion]
        );
      } else {
        await connection.execute(
          "UPDATE atletas SET estado_medico = 'apto' WHERE usuario_id = ?",
          [usuario.id]
        );
      }
    }

    // 3. Si es Entrenador, asegurar que exista el registro en la tabla entrenadores
    if (usuario.rol === 'entrenador') {
      const [coachRows] = await connection.execute(
        'SELECT id FROM entrenadores WHERE usuario_id = ?',
        [usuario.id]
      );

      if (coachRows.length === 0) {
        const deporteId = Number(req.body.deporte_id) > 0 ? Number(req.body.deporte_id) : 1;
        const especialidad = req.body.especialidad && String(req.body.especialidad).trim() !== '' ? String(req.body.especialidad).trim() : 'General';
        const licencia = req.body.licencia && String(req.body.licencia).trim() !== '' ? String(req.body.licencia).trim() : null;

        await connection.execute(
          `INSERT INTO entrenadores (
            usuario_id, deporte_id, especialidad, licencia
          ) VALUES (?, ?, ?, ?)`,
          [usuario.id, deporteId, especialidad, licencia]
        );
      }
    }

    // 4. Activar la cuenta y cambiar estado_registro a 'aprobado'
    await connection.execute(
      "UPDATE usuarios SET estado_registro = 'aprobado', activo = TRUE WHERE id = ?",
      [id]
    );

    await connection.commit();
    return res.json({ message: 'Cuenta aprobada y usuario activado correctamente con su perfil deportivo asociado.' });
  } catch (error) {
    await connection.rollback();
    console.error('[admin solicitudes aprobar]', error);
    return res.status(500).json({ message: 'Error al aprobar la solicitud.' });
  } finally {
    connection.release();
  }
};
router.put('/solicitudes/:id/aprobar', aprobarSolicitud);
router.patch('/solicitudes/:id/aprobar', aprobarSolicitud);

/**
 * PUT /api/admin/solicitudes/:id/rechazar y PATCH
 * Rechaza una solicitud de registro: estado_registro = 'rechazado' y activo = FALSE
 */
const rechazarSolicitud = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      "UPDATE usuarios SET estado_registro = 'rechazado', activo = FALSE WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    return res.json({ message: 'Cuenta rechazada correctamente.' });
  } catch (error) {
    console.error('[admin solicitudes rechazar]', error);
    return res.status(500).json({ message: 'Error al rechazar la solicitud.' });
  }
};
router.put('/solicitudes/:id/rechazar', rechazarSolicitud);
router.patch('/solicitudes/:id/rechazar', rechazarSolicitud);

module.exports = router;
