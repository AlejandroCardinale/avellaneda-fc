/**
 * ============================================================
 * DB.JS — Pool de conexiones a MySQL
 * ============================================================
 * En lugar de abrir y cerrar una conexión MySQL en cada petición
 * (lo cual sería lento y costoso), este módulo crea un POOL:
 * un conjunto de conexiones reutilizables que se prestan y devuelven.
 *
 * connectionLimit: 10 → máximo 10 conexiones simultáneas a la BD.
 * Si todas están ocupadas, las nuevas peticiones esperan en cola.
 *
 * Las credenciales se leen del archivo .env para no hardcodear
 * contraseñas en el código fuente.
 *
 * USO EN OTROS ARCHIVOS:
 *   const pool = require('./db');
 *   const [rows] = await pool.execute('SELECT * FROM usuarios');
 * ============================================================
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',
  database: process.env.DB_NAME     || 'avellaneda_fc',
  waitForConnections: true,  // Si no hay conexiones libres, espera en cola
  connectionLimit:    10,    // Máximo de conexiones abiertas simultáneamente
  queueLimit:         0      // Cola ilimitada (0 = sin límite)
});

module.exports = pool;
