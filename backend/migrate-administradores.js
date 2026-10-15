require('dotenv').config();
const pool = require('./db');

(async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS administradores (
        id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        usuario_id    INT UNSIGNED NOT NULL UNIQUE,
        dni           VARCHAR(20)  NOT NULL,
        cargo         VARCHAR(80)  NULL DEFAULT 'Administrador General',
        fecha_ingreso DATE         NOT NULL DEFAULT (CURDATE()),
        activo        BOOLEAN      NOT NULL DEFAULT TRUE,
        CONSTRAINT fk_admin_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla administradores creada correctamente');

    // Insertar admins existentes que aún no tienen registro en la tabla
    const [rows] = await pool.execute(`
      SELECT u.id, u.dni
      FROM usuarios u
      JOIN roles r ON r.id = u.rol_id
      LEFT JOIN administradores a ON a.usuario_id = u.id
      WHERE r.nombre = 'administrador' AND a.id IS NULL
    `);

    for (const u of rows) {
      const dni = u.dni || 'PENDIENTE';
      await pool.execute(
        `INSERT INTO administradores (usuario_id, dni) VALUES (?, ?)`,
        [u.id, dni]
      );
      console.log(`  → Admin usuario_id=${u.id} insertado (dni=${dni})`);
    }

    if (rows.length === 0) {
      console.log('  (No hay admins existentes pendientes de migrar)');
    }

    console.log('✅ Migración completada');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    pool.end();
  }
})();
