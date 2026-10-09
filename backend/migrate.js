require('dotenv').config();
const pool = require('./db');

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log('🔄 Ejecutando migración para columna entrenador_id en atletas...');

    // Verificar si la columna ya existe en la tabla atletas
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'atletas'
        AND COLUMN_NAME = 'entrenador_id'
    `);

    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE atletas
          ADD COLUMN entrenador_id INT UNSIGNED NULL,
          ADD CONSTRAINT fk_atleta_entrenador
            FOREIGN KEY (entrenador_id) REFERENCES entrenadores(id)
            ON DELETE SET NULL
      `);
      console.log('✅ Migración completada: columna entrenador_id y clave foránea añadidas a tabla atletas.');
    } else {
      console.log('ℹ️ La columna entrenador_id ya existe en la tabla atletas.');
    }
  } catch (error) {
    console.error('❌ Error ejecutando la migración:', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

migrate().catch(error => {
  console.error('❌ Fallo en la migración:', error.message);
  process.exitCode = 1;
});
