/**
 * generate-hashes.js
 * ----------------------------------------------------------
 * Genera hashes bcrypt reales para los usuarios de prueba
 * y los actualiza directamente en la base de datos MySQL.
 *
 * Uso:
 *   node database/generate-hashes.js
 *
 * Variables de entorno opcionales (o editalas directo aquí):
 *   DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
 * ----------------------------------------------------------
 */

const mysql  = require('mysql2/promise');
const bcrypt = require('bcrypt');

// ── Configuración de la conexión ──────────────────────────
const DB_CONFIG = {
  host    : process.env.DB_HOST || 'localhost',
  port    : parseInt(process.env.DB_PORT || '3306'),
  user    : process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',          // ← cambiá si tu root tiene contraseña
  database: process.env.DB_NAME || 'avellaneda_fc'
};

// ── Usuarios de prueba con contraseñas en texto plano ─────
const USUARIOS = [
  { email: 'admin@avellanedafc.com',       password: 'Admin1234!'    },
  { email: 'entrenador1@avellanedafc.com', password: 'Entrenador1!'  },
  { email: 'entrenador2@avellanedafc.com', password: 'Entrenador2!'  },
  { email: 'atleta1@avellanedafc.com',     password: 'Atleta1234!'   },
  { email: 'atleta2@avellanedafc.com',     password: 'Atleta1234!'   },
  { email: 'atleta3@avellanedafc.com',     password: 'Atleta1234!'   },
];

const SALT_ROUNDS = 12;

async function main() {
  console.log('🔐 Generando hashes bcrypt...\n');

  // 1. Generar hashes
  const updates = await Promise.all(
    USUARIOS.map(async (u) => {
      const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
      return { email: u.email, password: u.password, hash };
    })
  );

  // Mostrar tabla en consola
  console.log('Email                              | Contraseña         | Hash (primeros 30 chars)');
  console.log('-'.repeat(90));
  updates.forEach(u => {
    console.log(`${u.email.padEnd(35)}| ${u.password.padEnd(19)}| ${u.hash.substring(0, 30)}...`);
  });

  // 2. Conectar a MySQL y actualizar
  console.log(`\n📡 Conectando a MySQL (${DB_CONFIG.host}:${DB_CONFIG.port} / ${DB_CONFIG.database})...`);
  let conn;
  try {
    conn = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conectado.\n');

    for (const u of updates) {
      const [result] = await conn.execute(
        'UPDATE usuarios SET password_hash = ? WHERE email = ?',
        [u.hash, u.email]
      );
      const rows = result.affectedRows;
      console.log(`${rows > 0 ? '✅' : '⚠️ '} ${u.email} → ${rows} fila(s) actualizada(s)`);
    }

    console.log('\n🎉 ¡Listo! Todos los hashes fueron actualizados en la base de datos.');
    console.log('\nCredenciales para usar en el login:');
    console.log('─'.repeat(50));
    USUARIOS.forEach(u => console.log(`  ${u.email.padEnd(38)} → ${u.password}`));

  } catch (err) {
    console.error('\n❌ Error al conectar/actualizar:', err.message);
    console.error('\nVerificá:');
    console.error('  1. Que MySQL esté corriendo');
    console.error('  2. Que la base de datos "avellaneda_fc" exista (ejecutá el .sql primero)');
    console.error('  3. Usuario/contraseña de MySQL correctos (editá DB_CONFIG en el script)');
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
