-- Dashboard administrativo
-- Consulta base para métricas del panel

SELECT
  (SELECT COUNT(*) FROM atletas) AS total_atletas,
  (SELECT COUNT(*) FROM entrenadores) AS total_entrenadores,
  (SELECT COUNT(*) FROM solicitudes WHERE estado = 'pendiente') AS solicitudes_pendientes,
  (SELECT COUNT(*) FROM instalaciones WHERE activa = TRUE) AS recursos_disponibles;

SELECT id, titulo, descripcion, categoria, creado_en
FROM noticias
WHERE publicada = TRUE
ORDER BY creado_en DESC
LIMIT 5;

SELECT id, tipo, estado, creado_en, fecha_necesidad
FROM solicitudes
ORDER BY creado_en DESC
LIMIT 5;

SELECT DATE_FORMAT(fecha_hora, '%b') AS mes, COUNT(*) AS total
FROM (
  SELECT creado_en AS fecha_hora FROM usuarios
  UNION ALL
  SELECT creado_en AS fecha_hora FROM noticias
  UNION ALL
  SELECT creado_en AS fecha_hora FROM eventos
  UNION ALL
  SELECT creado_en AS fecha_hora FROM solicitudes
) t
GROUP BY DATE_FORMAT(fecha_hora, '%Y-%m')
ORDER BY MIN(fecha_hora)
LIMIT 12;
