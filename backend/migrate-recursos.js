require('dotenv').config();
const pool = require('./db');

async function migrate() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      ALTER TABLE catalogo_items
        ADD COLUMN IF NOT EXISTS cantidad_disponible INT UNSIGNED NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS estado ENUM('disponible', 'mantenimiento', 'stock_bajo') NOT NULL DEFAULT 'disponible'
    `);
    console.log('Migración de inventario aplicada correctamente.');
  } finally {
    connection.release();
    await pool.end();
  }
}

migrate().catch(error => {
  console.error('No se pudo aplicar la migración de inventario:', error.message);
  process.exitCode = 1;
});
