require('dotenv').config();
const pool = require('./db');

async function migrate() {
  const connection = await pool.getConnection();
  try {
    // Verificar si la columna ya existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'noticias'
        AND COLUMN_NAME = 'contenido'
    `);

    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE noticias
        ADD COLUMN contenido LONGTEXT NULL AFTER descripcion
      `);
      console.log('✅ Columna "contenido" agregada exitosamente a la tabla "noticias".');
    } else {
      console.log('ℹ️ La columna "contenido" ya existe en la tabla "noticias".');
    }

    await connection.query(`
      UPDATE noticias
      SET contenido = descripcion
      WHERE contenido IS NULL OR contenido = ''
    `);
  } catch (error) {
    console.error('❌ Error durante la migración de noticias:', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

migrate()
  .then(() => {
    console.log('Migración completada con éxito.');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
