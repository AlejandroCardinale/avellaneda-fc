const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/require-admin');

const router = express.Router();
const categories = ['equipamiento', 'indumentaria', 'transporte'];
const statuses = ['disponible', 'mantenimiento', 'stock_bajo'];

function validateResource(body) {
  const nombre = String(body.nombre || '').trim();
  const categoria = String(body.categoria || '');
  const descripcion = String(body.descripcion || '').trim();
  const icono = String(body.icono || 'fa-box').trim();
  const quantity = Number.parseInt(body.cantidad_disponible, 10);
  const requiereTalle = body.requiere_talle === true || body.requiere_talle === 'true' || body.requiere_talle === '1';
  const requiereNumero = body.requiere_numero === true || body.requiere_numero === 'true' || body.requiere_numero === '1';
  const activo = !(body.activo === false || body.activo === 'false' || body.activo === '0');
  if (!nombre || !categories.includes(categoria) || !Number.isInteger(quantity) || quantity < 0 || !statuses.includes(body.estado)) {
    return { error: 'Nombre, categoría, cantidad y estado son obligatorios y válidos.' };
  }
  return { nombre, categoria, descripcion, icono, requiereTalle, requiereNumero, quantity, estado: body.estado, activo };
}

router.use(auth, requireAdmin);

router.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const category = categories.includes(req.query.categoria) ? req.query.categoria : 'todas';
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(req.query.pageSize, 10) || 10, 1), 50);
    const offset = (page - 1) * pageSize;
    const params = [];
    const filters = ['activo = TRUE'];

    if (category !== 'todas') {
      filters.push('categoria = ?');
      params.push(category);
    }
    if (search) {
      filters.push('(nombre LIKE ? OR descripcion LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = filters.join(' AND ');
    const [[countRow]] = await pool.execute(`SELECT COUNT(*) AS total FROM catalogo_items WHERE ${where}`, params);
    const [rows] = await pool.execute(
      `SELECT id, categoria, nombre, descripcion, icono, cantidad_disponible, estado
       FROM catalogo_items WHERE ${where} ORDER BY categoria, nombre LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    const [[metrics]] = await pool.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(categoria = 'equipamiento') AS equipamiento,
        SUM(categoria = 'indumentaria') AS indumentaria,
        SUM(categoria = 'transporte') AS transporte
      FROM catalogo_items WHERE activo = TRUE
    `);

    return res.json({
      data: rows,
      total: Number(countRow.total || 0),
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(Number(countRow.total || 0) / pageSize), 1),
      metrics: {
        total: Number(metrics.total || 0),
        equipamiento: Number(metrics.equipamiento || 0),
        indumentaria: Number(metrics.indumentaria || 0),
        transporte: Number(metrics.transporte || 0)
      }
    });
  } catch (error) {
    console.error('[recursos:listar]', error);
    return res.status(500).json({ message: 'No se pudo cargar el inventario. Ejecutá la migración de recursos.' });
  }
});

router.post('/', async (req, res) => {
  const resource = validateResource(req.body);
  if (resource.error) return res.status(400).json({ message: resource.error });
  try {
    await pool.execute(
      `INSERT INTO catalogo_items (categoria, nombre, descripcion, icono, requiere_talle, requiere_numero, cantidad_disponible, estado, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [resource.categoria, resource.nombre, resource.descripcion || null, resource.icono, resource.requiereTalle,
        resource.requiereNumero, resource.quantity, resource.estado, resource.activo]
    );
    return res.status(201).json({ message: 'Recurso creado correctamente.' });
  } catch (error) {
    console.error('[recursos:crear]', error);
    return res.status(500).json({ message: 'No se pudo crear el recurso.' });
  }
});

router.put('/:id', async (req, res) => {
  const resource = validateResource(req.body);
  if (resource.error) return res.status(400).json({ message: resource.error });
  try {
    const [result] = await pool.execute(
      `UPDATE catalogo_items SET categoria = ?, nombre = ?, descripcion = ?, icono = ?, requiere_talle = ?,
       requiere_numero = ?, cantidad_disponible = ?, estado = ?, activo = ? WHERE id = ?`,
      [resource.categoria, resource.nombre, resource.descripcion || null, resource.icono, resource.requiereTalle,
        resource.requiereNumero, resource.quantity, resource.estado, resource.activo, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Recurso no encontrado.' });
    return res.json({ message: 'Recurso actualizado correctamente.' });
  } catch (error) {
    console.error('[recursos:actualizar-completo]', error);
    return res.status(500).json({ message: 'No se pudo actualizar el recurso.' });
  }
});

router.patch('/:id', async (req, res) => {
  const quantity = Number.parseInt(req.body.cantidad_disponible, 10);
  const estado = String(req.body.estado || '');
  if (!Number.isInteger(quantity) || quantity < 0 || !statuses.includes(estado)) {
    return res.status(400).json({ message: 'Cantidad o estado de recurso no válido.' });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE catalogo_items SET cantidad_disponible = ?, estado = ? WHERE id = ? AND activo = TRUE',
      [quantity, estado, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Recurso no encontrado.' });
    return res.json({ message: 'Recurso actualizado correctamente.' });
  } catch (error) {
    console.error('[recursos:actualizar]', error);
    return res.status(500).json({ message: 'No se pudo actualizar el recurso.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'UPDATE catalogo_items SET activo = FALSE WHERE id = ? AND activo = TRUE',
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Recurso no encontrado.' });
    return res.json({ message: 'Recurso eliminado del inventario.' });
  } catch (error) {
    console.error('[recursos:eliminar]', error);
    return res.status(500).json({ message: 'No se pudo eliminar el recurso.' });
  }
});

module.exports = router;
