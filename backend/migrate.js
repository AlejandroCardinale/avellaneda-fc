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

    // Verificar si la columna estado_registro ya existe en la tabla usuarios
    const [colsUsers] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'usuarios'
        AND COLUMN_NAME = 'estado_registro'
    `);

    if (colsUsers.length === 0) {
      await connection.query(`
        ALTER TABLE usuarios
          ADD COLUMN estado_registro ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'aprobado'
      `);
      console.log('✅ Columna estado_registro añadida a tabla usuarios.');
    } else {
      console.log('ℹ️ La columna estado_registro ya existe en la tabla usuarios.');
    }

    const [dniColumns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'usuarios'
        AND COLUMN_NAME = 'dni'
    `);

    if (dniColumns.length === 0) {
      await connection.query('ALTER TABLE usuarios ADD COLUMN dni VARCHAR(20) NULL');
      console.log('✅ Columna dni añadida a tabla usuarios.');
    } else {
      console.log('ℹ️ La columna dni ya existe en tabla usuarios.');
    }

    await connection.query(`
      UPDATE usuarios u
      JOIN atletas a ON a.usuario_id = u.id
      SET u.dni = a.dni
      WHERE u.dni IS NULL AND a.dni IS NOT NULL
    `);

    const [dniIndexes] = await connection.query(`
      SELECT INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'usuarios'
        AND COLUMN_NAME = 'dni'
        AND NON_UNIQUE = 0
    `);

    if (dniIndexes.length === 0) {
      await connection.query('CREATE UNIQUE INDEX uq_usuarios_dni ON usuarios (dni)');
      console.log('✅ Índice único añadido para DNI en usuarios.');
    } else {
      console.log('ℹ️ Ya existe un índice único para DNI en usuarios.');
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
