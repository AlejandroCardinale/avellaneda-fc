/**
 * ============================================================
 * ROUTES/SOLICITUDES.JS — API de Solicitudes
 * ============================================================
 * Maneja el CRUD completo del módulo de solicitudes:
 *   POST   /api/solicitudes          → Crear solicitud (cualquier usuario logueado)
 *   GET    /api/solicitudes/mias     → Ver mis solicitudes (usuario logueado)
 *   GET    /api/solicitudes          → Ver todas (solo administrador)
 *   PATCH  /api/solicitudes/:id/estado → Cambiar estado (solo administrador)
 *
 * CONTROL DE ACCESO:
 *   - Todas las rutas requieren estar logueado (middleware auth al inicio)
 *   - Las rutas de admin verifican adicionalmente que req.usuario.rol === 'administrador'
 *
 * TRANSACCIONES:
 *   El POST usa una transacción SQL. Esto garantiza que si falla al insertar
 *   algún ítem, la cabecera tampoco se guarda. O se guarda TODO o NADA.
 * ============================================================
 */
const express = require('express');
const pool    = require('../db');
const auth    = require('../middleware/auth');
const router  = express.Router();

/**
 * Aplica el middleware de autenticación JWT a TODAS las rutas de este router.
 * Si el token falla, la petición se corta aquí y no llega a ningún handler.
 */
router.use(auth);

// ─── POST /api/solicitudes ──────────────────────────────────────────────────
/**
 * Crea una nueva solicitud junto con todos sus ítems.
 *
 * Cuerpo esperado (JSON):
 *   {
 *     tipo: "indumentaria" | "equipamiento" | "transporte",
 *     fecha_necesidad: "2025-10-15",
 *     destino: "...",         (solo transporte)
 *     pasajeros: 20,          (solo transporte)
 *     observaciones: "...",
 *     items: [
 *       { nombre: "Camiseta de juego", talle: "M", numero_dorsal: 10, cantidad: 2 },
 *       { nombre: "Medias", talle: "L", cantidad: 2 }
 *     ]
 *   }
 *
 * La solicitud se guarda en DOS tablas:
 *   - 'solicitudes': la cabecera con fecha, tipo, estado ('pendiente' por defecto)
 *   - 'solicitud_items': un registro por cada ítem del array
 *
 * Se usa una TRANSACCIÓN para garantizar consistencia:
 *   si falla cualquier INSERT, se hace ROLLBACK de todos los cambios.
 *
 * El usuario_id viene del token JWT (req.usuario.id), no del body,
 * así no se puede falsificar quién hace la solicitud.
 */
router.post('/', async (req, res) => {
  const { tipo, fecha_necesidad, destino, pasajeros, observaciones, items } = req.body;
  const usuario_id = req.usuario.id; // Tomado del JWT, no del body del cliente

  if (!tipo || !fecha_necesidad || !items || items.length === 0) {
    return res.status(400).json({ message: 'Tipo, fecha y al menos un ítem son obligatorios.' });
  }

  // Obtener una conexión dedicada del pool para usar transacción
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction(); // Iniciar transacción

    // 1. Insertar la cabecera de la solicitud
    const [result] = await conn.execute(
      `INSERT INTO solicitudes (usuario_id, tipo, fecha_necesidad, destino, pasajeros, observaciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuario_id, tipo, fecha_necesidad, destino || null, pasajeros || null, observaciones || null]
    );
    const solicitud_id = result.insertId; // ID autogenerado de la solicitud recién creada

    // 2. Insertar cada ítem en solicitud_items (texto libre, sin referencia al catálogo)
    for (const item of items) {
      await conn.execute(
        `INSERT INTO solicitud_items (solicitud_id, nombre, item_id, cantidad, talle, numero_dorsal, observacion)
         VALUES (?, ?, NULL, ?, ?, ?, ?)`,
        [
          solicitud_id,
          item.nombre    || 'Sin descripción',
          item.cantidad  || 1,
          item.talle     || null,       // null si no es indumentaria
          item.numero_dorsal || null,   // null si no requiere dorsal
          item.observacion   || null
        ]
      );
    }

    await conn.commit(); // Todo OK → confirmar cambios en la BD
    return res.status(201).json({ id: solicitud_id, message: 'Solicitud creada correctamente.' });
  } catch (err) {
    await conn.rollback(); // Algo falló → deshacer todo
    console.error('[solicitudes POST]', err);
    return res.status(500).json({ message: 'Error al crear la solicitud.' });
  } finally {
    conn.release(); // Devolver la conexión al pool (siempre, con o sin error)
  }
});

// ─── GET /api/solicitudes/mias ──────────────────────────────────────────────
/**
 * Devuelve todas las solicitudes del usuario logueado, con sus ítems.
 *
 * Primero consulta todas las solicitudes del usuario_id del JWT.
 * Luego, para cada solicitud, hace una segunda consulta para traer sus ítems.
 * Este enfoque "N+1" es aceptable para volúmenes pequeños (solicitudes de un usuario).
 *
 * Nota: el JOIN con catalogo_items puede fallar si item_id es NULL
 * (ítems de texto libre). En ese caso el LEFT JOIN mostraría el nombre
 * guardado directamente en la columna 'nombre' de solicitud_items.
 */
router.get('/mias', async (req, res) => {
  try {
    // Traer las solicitudes del usuario logueado, ordenadas de la más reciente a la más antigua
    const [solicitudes] = await pool.execute(
      `SELECT s.id, s.tipo, s.estado, s.fecha_necesidad, s.destino, s.pasajeros,
              s.observaciones, s.creado_en
       FROM solicitudes s
       WHERE s.usuario_id = ?
       ORDER BY s.creado_en DESC`,
      [req.usuario.id]
    );

    // Para cada solicitud, traer sus ítems con detalles del catálogo (si tiene referencia)
    for (const sol of solicitudes) {
      const [items] = await pool.execute(
        `SELECT si.id, si.nombre, ci.icono, ci.categoria,
                si.cantidad, si.talle, si.numero_dorsal, si.observacion
         FROM solicitud_items si
         LEFT JOIN catalogo_items ci ON ci.id = si.item_id
         WHERE si.solicitud_id = ?`,
        [sol.id]
      );
      sol.items = items; // Agregar los ítems como propiedad del objeto solicitud
    }

    return res.json(solicitudes);
  } catch (err) {
    console.error('[solicitudes mias]', err);
    return res.status(500).json({ message: 'Error interno.' });
  }
});

// ─── GET /api/solicitudes ───────────────────────────────────────────────────
/**
 * Lista TODAS las solicitudes del sistema (solo para el administrador).
 * Soporta filtros opcionales por query string:
 *   GET /api/solicitudes?estado=pendiente
 *   GET /api/solicitudes?tipo=indumentaria
 *   GET /api/solicitudes?estado=aprobada&tipo=transporte
 *
 * Devuelve el nombre del solicitante y total de ítems por solicitud.
 */
router.get('/', async (req, res) => {
  // Verificar que el usuario sea administrador
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }
  try {
    const { estado, tipo } = req.query;
    // Base de la query — "WHERE 1=1" permite agregar filtros dinámicamente
    let sql    = `SELECT s.id, s.tipo, s.estado, s.fecha_necesidad, s.creado_en,
                         CONCAT(u.nombre,' ',u.apellido) AS solicitante, u.email,
                         (SELECT COUNT(*) FROM solicitud_items si WHERE si.solicitud_id=s.id) AS total_items
                  FROM solicitudes s JOIN usuarios u ON u.id=s.usuario_id WHERE 1=1`;
    const params = [];
    if (estado) { sql += ' AND s.estado=?'; params.push(estado); }
    if (tipo)   { sql += ' AND s.tipo=?';   params.push(tipo); }
    sql += ' ORDER BY s.creado_en DESC';
    const [rows] = await pool.execute(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('[solicitudes GET all]', err);
    return res.status(500).json({ message: 'Error interno.' });
  }
});

// ─── PATCH /api/solicitudes/:id/estado ─────────────────────────────────────
/**
 * Permite al administrador cambiar el estado de una solicitud.
 * Estados válidos: 'pendiente' → 'aprobada' | 'rechazada' | 'entregada'
 *
 * El :id viene en la URL (ej: /api/solicitudes/5/estado).
 * Se valida que el estado sea uno de los valores del ENUM de la BD.
 */
router.patch('/:id/estado', async (req, res) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }
  const { estado } = req.body;
  const estadosValidos = ['pendiente','aprobada','rechazada','entregada'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ message: 'Estado inválido.' });
  }
  try {
    await pool.execute('UPDATE solicitudes SET estado=? WHERE id=?', [estado, req.params.id]);
    return res.json({ message: 'Estado actualizado.' });
  } catch (err) {
    console.error('[solicitudes PATCH]', err);
    return res.status(500).json({ message: 'Error interno.' });
  }
});

module.exports = router;
