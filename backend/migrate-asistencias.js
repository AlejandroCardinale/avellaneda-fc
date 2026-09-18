require('dotenv').config();
const pool = require('./db');

async function migrate() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS asistencias_entrenamiento (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        atleta_id INT UNSIGNED NOT NULL,
        fecha DATE NOT NULL,
        presente BOOLEAN NOT NULL DEFAULT FALSE,
        creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_asistencias_entrenamiento_atleta FOREIGN KEY (atleta_id) REFERENCES atletas(id) ON DELETE CASCADE,
        UNIQUE KEY uq_asistencia_atleta_fecha (atleta_id, fecha),
        INDEX idx_asistencia_fecha (fecha)
      )
    `);
    console.log('Migración de asistencias aplicada correctamente.');
  } finally {
    connection.release();
    await pool.end();
  }
}

migrate().catch(error => {
  console.error('No se pudo aplicar la migración de asistencias:', error.message);
  process.exitCode = 1;
});
