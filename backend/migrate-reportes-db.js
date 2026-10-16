require('dotenv').config();
const pool = require('./db');

// mysql2 usa prepared statements en execute() — incompatible con DDL.
// Usamos query() (protocolo de texto) para CREATE FUNCTION/TRIGGER/PROCEDURE.
async function ddl(conn, sql) {
  return conn.query(sql);
}

(async () => {
  const conn = await pool.getConnection();
  try {
    console.log('🔧 Creando objetos de base de datos para reportes...\n');

    // ── TABLA AUXILIAR ─────────────────────────────────────────────
    await ddl(conn, `
      CREATE TABLE IF NOT EXISTS estadisticas_asistencia (
        id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        atleta_id        INT UNSIGNED NOT NULL UNIQUE,
        total_sesiones   INT UNSIGNED NOT NULL DEFAULT 0,
        total_presentes  INT UNSIGNED NOT NULL DEFAULT 0,
        porcentaje       DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        ultima_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_estadisticas_atleta
          FOREIGN KEY (atleta_id) REFERENCES atletas(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla estadisticas_asistencia');

    // ── FUNCIÓN ALMACENADA ─────────────────────────────────────────
    await ddl(conn, `DROP FUNCTION IF EXISTS fn_porcentaje_asistencia`);
    await ddl(conn, `
      CREATE FUNCTION fn_porcentaje_asistencia(p_atleta_id INT UNSIGNED)
        RETURNS DECIMAL(5,2)
        READS SQL DATA
        DETERMINISTIC
      BEGIN
        DECLARE v_total    INT DEFAULT 0;
        DECLARE v_presente INT DEFAULT 0;
        SELECT COUNT(*),
               SUM(CASE WHEN presente = TRUE THEN 1 ELSE 0 END)
        INTO v_total, v_presente
        FROM asistencias
        WHERE atleta_id = p_atleta_id;
        IF v_total = 0 THEN RETURN 0.00; END IF;
        RETURN ROUND((v_presente / v_total) * 100, 2);
      END
    `);
    console.log('✅ Función fn_porcentaje_asistencia');

    // ── TRIGGER ────────────────────────────────────────────────────
    await ddl(conn, `DROP TRIGGER IF EXISTS trg_actualizar_estadisticas_asistencia`);
    await ddl(conn, `
      CREATE TRIGGER trg_actualizar_estadisticas_asistencia
      AFTER INSERT ON asistencias
      FOR EACH ROW
      BEGIN
        DECLARE v_total   INT DEFAULT 0;
        DECLARE v_present INT DEFAULT 0;
        SELECT COUNT(*),
               SUM(CASE WHEN presente = TRUE THEN 1 ELSE 0 END)
        INTO v_total, v_present
        FROM asistencias WHERE atleta_id = NEW.atleta_id;

        INSERT INTO estadisticas_asistencia
          (atleta_id, total_sesiones, total_presentes, porcentaje)
        VALUES
          (NEW.atleta_id, v_total, COALESCE(v_present,0),
           fn_porcentaje_asistencia(NEW.atleta_id))
        ON DUPLICATE KEY UPDATE
          total_sesiones       = v_total,
          total_presentes      = COALESCE(v_present, 0),
          porcentaje           = fn_porcentaje_asistencia(NEW.atleta_id),
          ultima_actualizacion = NOW();
      END
    `);
    console.log('✅ Trigger trg_actualizar_estadisticas_asistencia');

    // ── STORED PROCEDURE ───────────────────────────────────────────
    await ddl(conn, `DROP PROCEDURE IF EXISTS sp_reporte_general`);
    await ddl(conn, `
      CREATE PROCEDURE sp_reporte_general(
        IN p_desde      DATE,
        IN p_hasta      DATE,
        IN p_deporte_id INT UNSIGNED
      )
      BEGIN
        -- 1. MÉTRICAS GLOBALES
        SELECT
          (SELECT COUNT(*) FROM atletas a
           WHERE a.estado_medico <> 'no_apto'
             AND (p_deporte_id = 0 OR a.deporte_id = p_deporte_id)
             AND (p_desde IS NULL OR a.fecha_alta >= p_desde)
             AND (p_hasta IS NULL OR a.fecha_alta <= p_hasta)
          ) AS total_atletas,
          (SELECT COALESCE(ROUND(100 * AVG(x.presente), 2), 0)
           FROM asistencias x
           JOIN sesiones s ON s.id = x.sesion_id
           JOIN atletas  a ON a.id = x.atleta_id
           WHERE (p_deporte_id = 0 OR a.deporte_id = p_deporte_id)
             AND (p_desde IS NULL OR s.fecha_hora >= p_desde)
             AND (p_hasta IS NULL OR s.fecha_hora < DATE_ADD(p_hasta, INTERVAL 1 DAY))
          ) AS promedio_asistencia,
          (SELECT COALESCE(SUM(si.cantidad), 0)
           FROM solicitud_items si
           JOIN solicitudes sol ON sol.id = si.solicitud_id
           WHERE sol.estado IN ('aprobada','entregada')
             AND (p_desde IS NULL OR sol.creado_en >= p_desde)
             AND (p_hasta IS NULL OR sol.creado_en < DATE_ADD(p_hasta, INTERVAL 1 DAY))
          ) AS recursos_en_uso,
          (SELECT COUNT(*) FROM solicitudes sol
           WHERE sol.estado IN ('aprobada','entregada')
             AND (p_desde IS NULL OR sol.creado_en >= p_desde)
             AND (p_hasta IS NULL OR sol.creado_en < DATE_ADD(p_hasta, INTERVAL 1 DAY))
          ) AS solicitudes_resueltas;

        -- 2. ATLETAS POR DISCIPLINA
        SELECT d.id, d.nombre, COUNT(a.id) AS total,
               COALESCE(ROUND(AVG(fn_porcentaje_asistencia(a.id)),1),0) AS pct_asistencia
        FROM deportes d
        LEFT JOIN atletas a ON a.deporte_id = d.id
          AND a.estado_medico <> 'no_apto'
          AND (p_desde IS NULL OR a.fecha_alta >= p_desde)
          AND (p_hasta IS NULL OR a.fecha_alta <= p_hasta)
        WHERE d.activo = TRUE AND (p_deporte_id = 0 OR d.id = p_deporte_id)
        GROUP BY d.id, d.nombre ORDER BY total DESC, d.nombre LIMIT 8;

        -- 3. ASISTENCIA SEMANAL
        SELECT YEARWEEK(s.fecha_hora, 1) AS semana,
               DATE_FORMAT(MIN(s.fecha_hora),'%d/%m') AS periodo,
               ROUND(100 * AVG(x.presente), 0) AS porcentaje
        FROM asistencias x
        JOIN sesiones s ON s.id = x.sesion_id
        JOIN atletas  a ON a.id = x.atleta_id
        WHERE (p_deporte_id = 0 OR a.deporte_id = p_deporte_id)
          AND (p_desde IS NULL OR s.fecha_hora >= p_desde)
          AND (p_hasta IS NULL OR s.fecha_hora < DATE_ADD(p_hasta, INTERVAL 1 DAY))
        GROUP BY YEARWEEK(s.fecha_hora, 1) ORDER BY semana DESC LIMIT 12;

        -- 4. REGISTROS POR PERÍODO
        SELECT YEARWEEK(a.fecha_alta, 1) AS semana,
               DATE_FORMAT(MIN(a.fecha_alta),'%d/%m') AS periodo,
               COUNT(*) AS total
        FROM atletas a
        WHERE a.estado_medico <> 'no_apto'
          AND (p_deporte_id = 0 OR a.deporte_id = p_deporte_id)
          AND (p_desde IS NULL OR a.fecha_alta >= p_desde)
          AND (p_hasta IS NULL OR a.fecha_alta <= p_hasta)
        GROUP BY YEARWEEK(a.fecha_alta, 1) ORDER BY semana DESC LIMIT 12;

        -- 5. RECURSOS MÁS SOLICITADOS
        SELECT ci.nombre, COALESCE(SUM(si.cantidad), 0) AS total
        FROM solicitud_items si
        JOIN catalogo_items ci ON ci.id = si.item_id
        JOIN solicitudes sol   ON sol.id = si.solicitud_id
        WHERE sol.estado IN ('aprobada','entregada')
          AND (p_desde IS NULL OR sol.creado_en >= p_desde)
          AND (p_hasta IS NULL OR sol.creado_en < DATE_ADD(p_hasta, INTERVAL 1 DAY))
        GROUP BY ci.id, ci.nombre ORDER BY total DESC, ci.nombre LIMIT 5;

        -- 6. DETALLE ASISTENCIAS
        SELECT CONCAT(u.nombre,' ',u.apellido) AS atleta,
               s.titulo AS entrenamiento, s.fecha_hora AS fecha, x.presente
        FROM asistencias x
        JOIN sesiones s ON s.id = x.sesion_id
        JOIN atletas  a ON a.id = x.atleta_id
        JOIN usuarios u ON u.id = a.usuario_id
        WHERE (p_deporte_id = 0 OR a.deporte_id = p_deporte_id)
          AND (p_desde IS NULL OR s.fecha_hora >= p_desde)
          AND (p_hasta IS NULL OR s.fecha_hora < DATE_ADD(p_hasta, INTERVAL 1 DAY))
        ORDER BY s.fecha_hora DESC, u.apellido, u.nombre LIMIT 20;

        -- 7. ACTIVIDAD DE RECURSOS
        SELECT ci.nombre AS recurso,
               CONCAT(u.nombre,' ',u.apellido) AS usuario,
               sol.creado_en AS fecha, sol.estado
        FROM solicitudes sol
        JOIN usuarios u         ON u.id  = sol.usuario_id
        JOIN solicitud_items si ON si.solicitud_id = sol.id
        JOIN catalogo_items ci  ON ci.id = si.item_id
        WHERE (p_desde IS NULL OR sol.creado_en >= p_desde)
          AND (p_hasta IS NULL OR sol.creado_en < DATE_ADD(p_hasta, INTERVAL 1 DAY))
        ORDER BY sol.creado_en DESC LIMIT 20;

        -- 8. RANKING DE ATLETAS (usa la función almacenada)
        SELECT CONCAT(u.nombre,' ',u.apellido) AS atleta,
               d.nombre AS deporte,
               fn_porcentaje_asistencia(a.id) AS pct_asistencia,
               (SELECT COUNT(*) FROM asistencias WHERE atleta_id = a.id) AS sesiones_totales
        FROM atletas a
        JOIN usuarios u ON u.id = a.usuario_id
        JOIN deportes d ON d.id = a.deporte_id
        WHERE (p_deporte_id = 0 OR a.deporte_id = p_deporte_id)
        ORDER BY pct_asistencia DESC LIMIT 10;
      END
    `);
    console.log('✅ Procedimiento sp_reporte_general');

    // Poblar tabla con datos históricos
    await ddl(conn, `
      INSERT INTO estadisticas_asistencia
        (atleta_id, total_sesiones, total_presentes, porcentaje)
      SELECT atleta_id, COUNT(*),
             SUM(CASE WHEN presente = TRUE THEN 1 ELSE 0 END),
             fn_porcentaje_asistencia(atleta_id)
      FROM asistencias
      GROUP BY atleta_id
      ON DUPLICATE KEY UPDATE
        total_sesiones  = VALUES(total_sesiones),
        total_presentes = VALUES(total_presentes),
        porcentaje      = VALUES(porcentaje)
    `);
    console.log('✅ Datos históricos poblados');

    console.log('\n🎉 Migración completada exitosamente');
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.sqlState) console.error('   SQL State:', err.sqlState);
    process.exitCode = 1;
  } finally {
    conn.release();
    pool.end();
  }
})();
