const express  = require('express');
const pool     = require('../db');
const auth     = require('../middleware/auth');
const router   = express.Router();

// ─── GET /api/catalogo?categoria=indumentaria ─────────────────────────────
// Público: devuelve el catálogo de ítems
router.get('/', async (req, res) => {
  try {
    const { categoria } = req.query;
    let sql    = 'SELECT * FROM catalogo_items WHERE activo = 1';
    const params = [];
    if (categoria) { sql += ' AND categoria = ?'; params.push(categoria); }
    sql += ' ORDER BY categoria, id';
    const [rows] = await pool.execute(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error('[catalogo]', err);
    return res.status(500).json({ message: 'Error interno.' });
  }
});

module.exports = router;
