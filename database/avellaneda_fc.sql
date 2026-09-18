-- =============================================================
--  AVELLANEDA FC  –  Base de datos completa
--  Motor: MySQL / MariaDB
--  Codificacion: utf8mb4
-- =============================================================

CREATE DATABASE IF NOT EXISTS avellaneda_fc
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE avellaneda_fc;

-- =============================================================
-- 1. ROLES
-- =============================================================
CREATE TABLE roles (
  id          TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(30)  NOT NULL UNIQUE,
  descripcion VARCHAR(120)
);

INSERT INTO roles (nombre, descripcion) VALUES
  ('administrador', 'Acceso total al sistema'),
  ('entrenador',    'Gestiona deportes, atletas y entrenamientos'),
  ('atleta',        'Consulta su perfil, turnos y resultados');

-- =============================================================
-- 2. USUARIOS
-- =============================================================
CREATE TABLE usuarios (
  id             INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
  rol_id         TINYINT UNSIGNED NOT NULL,
  nombre         VARCHAR(60)      NOT NULL,
  apellido       VARCHAR(60)      NOT NULL,
  email          VARCHAR(120)     NOT NULL UNIQUE,
  password_hash  VARCHAR(255)     NOT NULL,
  telefono       VARCHAR(20),
  avatar_url     VARCHAR(255),
  activo         BOOLEAN          NOT NULL DEFAULT TRUE,
  creado_en      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ultimo_login   DATETIME,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE INDEX idx_usuario_email ON usuarios(email);
CREATE INDEX idx_usuario_rol   ON usuarios(rol_id);

-- Datos de prueba — hashes bcrypt reales (salt 12)
-- Contraseñas:
--   admin@avellanedafc.com       → Admin1234!
--   entrenador1@avellanedafc.com → Entrenador1!
--   entrenador2@avellanedafc.com → Entrenador2!
--   atleta1/2/3@avellanedafc.com → Atleta1234!
INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono) VALUES
  (1, 'Carlos',  'Gomez',     'admin@avellanedafc.com',       '$2b$12$gcsQuOePQSO/6qbB3rpeYuP.NyBc1WWN3j4HWeXV.Omr6edpnuWOS', '1122334455'),
  (2, 'Martin',  'Rodriguez', 'entrenador1@avellanedafc.com', '$2b$12$MIJ22SZbaiaBzBIZDC0BFOo4vSajZBUrR32HqqUTlBZeBADgXL4X.', '1133445566'),
  (2, 'Lucia',   'Fernandez', 'entrenador2@avellanedafc.com', '$2b$12$rEcfrRPMKwHwnqrXoTA1EOJn6rZV9psKrRsEmc7A3Ni7vXFwwocNi', '1144556677'),
  (3, 'Juan',    'Perez',     'atleta1@avellanedafc.com',     '$2b$12$a6kziXiNfPDl.HmPsrfipOk5K7qnktLSx3rt6s7.pXpraveJ6cKe2', '1155667788'),
  (3, 'Sofia',   'Lopez',     'atleta2@avellanedafc.com',     '$2b$12$sYEEGzXZuqG0azmFBGry2..c/XvZjWbpGJZzAVESXIu5Ohu52yfU.', '1166778899'),
  (3, 'Tomas',   'Garcia',    'atleta3@avellanedafc.com',     '$2b$12$nOLx.wLQgsc2bYD3wf/PD.lrQpZOTTlpobdGIIPzw8KK79V.DFLky', '1177889900');

-- =============================================================
-- 3. DEPORTES
-- =============================================================
CREATE TABLE deportes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(60)  NOT NULL UNIQUE,
  descripcion TEXT,
  icono       VARCHAR(50),
  imagen_url  VARCHAR(255),
  activo      BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO deportes (nombre, descripcion, icono, imagen_url) VALUES
  ('Futbol',         'El deporte mas popular del club.',                            'fa-futbol',          'images/football_pitch.png'),
  ('Natacion',       'Piscina olimpica de 50 metros, clases para todas las edades.','fa-water',           'images/pool.png'),
  ('Tenis',          'Canchas de polvo de ladrillo y pasto sintetico.',             'fa-circle',          'images/tennis.png'),
  ('Gimnasio',       'Equipamiento de ultima generacion y entrenadores.',           'fa-dumbbell',        'images/gym.png'),
  ('Basquet',        'Categorias menores, juveniles y primera division.',           'fa-basketball',      'images/football_pitch.png'),
  ('Voley',          'Equipos en competencia regional.',                            'fa-volleyball-ball', 'images/football_pitch.png'),
  ('Atletismo',      'Pista homologada con entrenadores especializados.',           'fa-person-running',  'images/football_pitch.png'),
  ('Artes Marciales','Judo, Karate y Taekwondo.',                                  'fa-hand-fist',       'images/gym.png');

-- =============================================================
-- 4. CATEGORIAS
-- =============================================================
CREATE TABLE categorias (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  deporte_id  INT UNSIGNED NOT NULL,
  nombre      VARCHAR(60)  NOT NULL,
  descripcion VARCHAR(120),
  CONSTRAINT fk_categoria_deporte FOREIGN KEY (deporte_id) REFERENCES deportes(id)
);

INSERT INTO categorias (deporte_id, nombre) VALUES
  (1, 'Infantil'), (1, 'Sub-15'), (1, 'Sub-17'), (1, 'Primera Division'),
  (2, 'Bebes'),    (2, 'Ninos'),  (2, 'Adultos'),
  (3, 'Singles'),  (3, 'Dobles'),
  (5, 'Sub-15'),   (5, 'Sub-17'), (5, 'Primera Masculino'), (5, 'Primera Femenino'),
  (6, 'Masculino'),(6, 'Femenino'),
  (8, 'Judo'),     (8, 'Karate'), (8, 'Taekwondo');

-- =============================================================
-- 5a. PERFIL ATLETA
-- =============================================================
CREATE TABLE atletas (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id       INT UNSIGNED NOT NULL UNIQUE,
  deporte_id       INT UNSIGNED NOT NULL,
  categoria_id     INT UNSIGNED,
  fecha_nacimiento DATE,
  dni              VARCHAR(15) UNIQUE,
  numero_socio     VARCHAR(20) UNIQUE,
  fecha_alta       DATE        NOT NULL DEFAULT (CURDATE()),
  posicion         VARCHAR(60),
  estado_medico    ENUM('apto','no_apto','pendiente') NOT NULL DEFAULT 'pendiente',
  observaciones    TEXT,
  CONSTRAINT fk_atleta_usuario   FOREIGN KEY (usuario_id)   REFERENCES usuarios(id),
  CONSTRAINT fk_atleta_deporte   FOREIGN KEY (deporte_id)   REFERENCES deportes(id),
  CONSTRAINT fk_atleta_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE asistencias_entrenamiento (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  atleta_id INT UNSIGNED NOT NULL,
  fecha DATE NOT NULL,
  presente BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_asistencias_entrenamiento_atleta FOREIGN KEY (atleta_id) REFERENCES atletas(id) ON DELETE CASCADE,
  UNIQUE KEY uq_asistencia_atleta_fecha (atleta_id, fecha),
  INDEX idx_asistencia_fecha (fecha)
);

INSERT INTO atletas (usuario_id, deporte_id, categoria_id, fecha_nacimiento, dni, numero_socio, posicion, estado_medico) VALUES
  (4, 1, 4, '2000-05-12', '35000001', 'S-0001', 'Delantero', 'apto'),
  (5, 2, 7, '1998-09-23', '35000002', 'S-0002', NULL,         'apto'),
  (6, 5, 12,'2003-01-30', '35000003', 'S-0003', 'Base',       'pendiente');

-- =============================================================
-- 5b. PERFIL ENTRENADOR
-- =============================================================
CREATE TABLE entrenadores (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id    INT UNSIGNED NOT NULL UNIQUE,
  deporte_id    INT UNSIGNED NOT NULL,
  especialidad  VARCHAR(120),
  licencia      VARCHAR(50),
  fecha_ingreso DATE         NOT NULL DEFAULT (CURDATE()),
  CONSTRAINT fk_entrenador_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_entrenador_deporte FOREIGN KEY (deporte_id) REFERENCES deportes(id)
);

INSERT INTO entrenadores (usuario_id, deporte_id, especialidad, licencia) VALUES
  (2, 1, 'Futbol infantil y juvenil', 'LIC-001'),
  (3, 2, 'Natacion competitiva',      'LIC-002');

-- =============================================================
-- 6. INSTALACIONES
-- =============================================================
CREATE TABLE instalaciones (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(80)  NOT NULL,
  descripcion TEXT,
  icono       VARCHAR(50),
  imagen_url  VARCHAR(255),
  capacidad   SMALLINT UNSIGNED,
  tipo        VARCHAR(40),
  activa      BOOLEAN      NOT NULL DEFAULT TRUE
);

INSERT INTO instalaciones (nombre, descripcion, icono, imagen_url, capacidad, tipo) VALUES
  ('Cancha de Futbol',  'Cesped natural reglamentario con iluminacion LED.',    'fa-futbol',  'images/football_pitch.png', 200, 'Deportiva'),
  ('Piscina Olimpica',  'Piscina de 50m, 8 carriles, temperatura regulada.',    'fa-water',   'images/pool.png',           300, 'Acuatica'),
  ('Gimnasio',          '800m2 con equipos de ultima generacion.',               'fa-dumbbell','images/gym.png',             80,  'Fitness'),
  ('Canchas de Tenis',  '4 canchas con polvo de ladrillo y pasto sintetico.',   'fa-circle',  'images/tennis.png',          40,  'Deportiva'),
  ('Polideportivo',     'Cancha cubierta multiuso para basquet y voley.',        'fa-building','images/football_pitch.png', 500, 'Deportiva');

-- =============================================================
-- 7. SESIONES DE ENTRENAMIENTO
-- =============================================================
CREATE TABLE sesiones (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entrenador_id  INT UNSIGNED NOT NULL,
  deporte_id     INT UNSIGNED NOT NULL,
  categoria_id   INT UNSIGNED,
  instalacion_id INT UNSIGNED,
  titulo         VARCHAR(120) NOT NULL,
  descripcion    TEXT,
  fecha_hora     DATETIME     NOT NULL,
  duracion_min   SMALLINT UNSIGNED NOT NULL DEFAULT 90,
  estado         ENUM('programada','en_curso','finalizada','cancelada') NOT NULL DEFAULT 'programada',
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sesion_entrenador   FOREIGN KEY (entrenador_id)  REFERENCES entrenadores(id),
  CONSTRAINT fk_sesion_deporte      FOREIGN KEY (deporte_id)     REFERENCES deportes(id),
  CONSTRAINT fk_sesion_categoria    FOREIGN KEY (categoria_id)   REFERENCES categorias(id),
  CONSTRAINT fk_sesion_instalacion  FOREIGN KEY (instalacion_id) REFERENCES instalaciones(id)
);

-- =============================================================
-- 8. ASISTENCIAS
-- =============================================================
CREATE TABLE asistencias (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sesion_id     INT UNSIGNED NOT NULL,
  atleta_id     INT UNSIGNED NOT NULL,
  presente      BOOLEAN      NOT NULL DEFAULT FALSE,
  observacion   VARCHAR(200),
  registrado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_asistencia (sesion_id, atleta_id),
  CONSTRAINT fk_asistencia_sesion FOREIGN KEY (sesion_id) REFERENCES sesiones(id),
  CONSTRAINT fk_asistencia_atleta FOREIGN KEY (atleta_id) REFERENCES atletas(id)
);

-- =============================================================
-- 9. RESERVAS DE INSTALACIONES
-- =============================================================
CREATE TABLE reservas (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  instalacion_id  INT UNSIGNED NOT NULL,
  usuario_id      INT UNSIGNED NOT NULL,
  fecha_hora_ini  DATETIME     NOT NULL,
  fecha_hora_fin  DATETIME     NOT NULL,
  motivo          VARCHAR(120),
  estado          ENUM('pendiente','confirmada','cancelada') NOT NULL DEFAULT 'pendiente',
  creado_en       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reserva_instalacion FOREIGN KEY (instalacion_id) REFERENCES instalaciones(id),
  CONSTRAINT fk_reserva_usuario     FOREIGN KEY (usuario_id)     REFERENCES usuarios(id)
);

-- =============================================================
-- 10. EVENTOS
-- =============================================================
CREATE TABLE eventos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo      VARCHAR(120) NOT NULL,
  descripcion TEXT,
  fecha_hora  DATETIME     NOT NULL,
  lugar       VARCHAR(120),
  disciplina  VARCHAR(60),
  categoria   VARCHAR(60),
  imagen_url  VARCHAR(255),
  publicado   BOOLEAN      NOT NULL DEFAULT FALSE,
  creado_por  INT UNSIGNED NOT NULL,
  creado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_evento_creador FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

INSERT INTO eventos (titulo, descripcion, fecha_hora, lugar, disciplina, categoria, imagen_url, publicado, creado_por) VALUES
  ('Torneo Interclubes de Futbol',    'Gran torneo regional con mas de 20 clubes.',             '2025-09-15 09:00:00', 'Canchas de Futbol',      'Futbol',  'Torneos',    'images/football_pitch.png', TRUE, 1),
  ('Campeonato de Tenis 2025',        'Torneo interno anual de tenis.',                         '2025-09-22 10:00:00', 'Canchas de Tenis',       'Tenis',   'Deportivos', 'images/tennis.png',         TRUE, 1),
  ('Liga Regional de Basquet Final',  'Final de la liga regional.',                             '2025-10-05 20:00:00', 'Polideportivo Cubierto', 'Basquet', 'Deportivos', 'images/football_pitch.png', TRUE, 1),
  ('Cena Anual del Club',             'Celebracion con musica en vivo y premiacion.',           '2025-11-20 21:00:00', 'Salon de Eventos',       'Social',  'Sociales',   'images/football_pitch.png', TRUE, 1);

-- =============================================================
-- 11. NOTICIAS
-- =============================================================
CREATE TABLE noticias (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo         VARCHAR(160) NOT NULL,
  descripcion    TEXT         NOT NULL,
  categoria      VARCHAR(40),
  imagen_url     VARCHAR(255),
  destacada      BOOLEAN      NOT NULL DEFAULT FALSE,
  publicada      BOOLEAN      NOT NULL DEFAULT FALSE,
  creado_por     INT UNSIGNED NOT NULL,
  creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_noticia_creador FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

INSERT INTO noticias (titulo, descripcion, categoria, imagen_url, destacada, publicada, creado_por) VALUES
  ('Torneo Interclubes 2025',           'Avellaneda FC participara en el torneo interclubes.',          'Deportes',      'images/football_pitch.png', TRUE,  TRUE, 1),
  ('Nueva Cancha de Tenis Inaugurada',  'Inauguramos dos nuevas canchas con pasto sintetico.',          'Institucional', 'images/tennis.png',         FALSE, TRUE, 1),
  ('Convocatoria Equipo Juvenil',       'Inscripciones abiertas para equipos juveniles.',               'Deportes',      'images/football_pitch.png', FALSE, TRUE, 1),
  ('Horarios de Piscina Olimpica',      'Se actualizan los horarios para el segundo semestre.',         'Comunicados',   'images/pool.png',           FALSE, TRUE, 1),
  ('Premiacion Anual de Deportistas',   'El club celebra su ceremonia anual de premiacion.',            'Eventos',       'images/football_pitch.png', FALSE, TRUE, 1),
  ('Nuevos Equipos en el Gimnasio',     'El gimnasio incorpora 15 nuevas maquinas.',                    'Institucional', 'images/gym.png',            FALSE, TRUE, 1),
  ('Avanzan las obras',                 'Nuevos vestuarios y espacios de entrenamiento.',               'Institucional', 'images/pool.png',           TRUE,  TRUE, 1);

-- =============================================================
-- 12. MENSAJES DE CONTACTO
-- =============================================================
CREATE TABLE contactos (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(80)  NOT NULL,
  email     VARCHAR(120) NOT NULL,
  asunto    VARCHAR(120),
  mensaje   TEXT         NOT NULL,
  leido     BOOLEAN      NOT NULL DEFAULT FALSE,
  creado_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- 13. REFRESH TOKENS (JWT)
-- =============================================================
CREATE TABLE refresh_tokens (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  token      VARCHAR(512) NOT NULL UNIQUE,
  expira_en  DATETIME     NOT NULL,
  revocado   BOOLEAN      NOT NULL DEFAULT FALSE,
  creado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_token_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- =============================================================
-- VISTAS UTILES
-- =============================================================

-- Usuarios con su rol
CREATE OR REPLACE VIEW v_usuarios AS
SELECT
  u.id, u.nombre, u.apellido, u.email, u.telefono,
  r.nombre AS rol,
  u.activo, u.creado_en, u.ultimo_login
FROM usuarios u
JOIN roles r ON r.id = u.rol_id;

-- Atletas con deporte y categoria
CREATE OR REPLACE VIEW v_atletas AS
SELECT
  a.id, u.nombre, u.apellido, u.email,
  d.nombre AS deporte,
  c.nombre AS categoria,
  a.numero_socio, a.posicion, a.estado_medico
FROM atletas a
JOIN usuarios   u ON u.id = a.usuario_id
JOIN deportes   d ON d.id = a.deporte_id
LEFT JOIN categorias c ON c.id = a.categoria_id;

-- Sesiones con entrenador e instalacion
CREATE OR REPLACE VIEW v_sesiones AS
SELECT
  s.id, s.titulo, s.fecha_hora, s.duracion_min, s.estado,
  CONCAT(u.nombre, ' ', u.apellido) AS entrenador,
  d.nombre AS deporte,
  c.nombre AS categoria,
  i.nombre AS instalacion
FROM sesiones s
JOIN entrenadores  e ON e.id = s.entrenador_id
JOIN usuarios      u ON u.id = e.usuario_id
JOIN deportes      d ON d.id = s.deporte_id
LEFT JOIN categorias    c ON c.id = s.categoria_id
LEFT JOIN instalaciones i ON i.id = s.instalacion_id;

-- =============================================================
-- 11. MÓDULO SOLICITUDES
-- =============================================================

-- Catálogo de ítems disponibles para solicitar
CREATE TABLE catalogo_items (
  id              INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  categoria       ENUM('indumentaria','equipamiento','transporte') NOT NULL,
  nombre          VARCHAR(100)   NOT NULL,
  descripcion     VARCHAR(255),
  icono           VARCHAR(60)    NOT NULL DEFAULT 'fa-box',
  requiere_talle  BOOLEAN        NOT NULL DEFAULT FALSE,
  requiere_numero BOOLEAN        NOT NULL DEFAULT FALSE,
  activo          BOOLEAN        NOT NULL DEFAULT TRUE
  ,cantidad_disponible INT UNSIGNED NOT NULL DEFAULT 0
  ,estado          ENUM('disponible', 'mantenimiento', 'stock_bajo') NOT NULL DEFAULT 'disponible'
);

INSERT INTO catalogo_items (categoria, nombre, descripcion, icono, requiere_talle, requiere_numero) VALUES
  -- Indumentaria
  ('indumentaria', 'Camiseta de juego',   'Camiseta oficial del club con dorsal', 'fa-shirt',          TRUE,  TRUE),
  ('indumentaria', 'Short de juego',      'Short oficial del club',               'fa-person-running', TRUE,  FALSE),
  ('indumentaria', 'Medias',              'Medias de juego',                      'fa-socks',          TRUE,  FALSE),
  ('indumentaria', 'Buzo',               'Buzo de entrenamiento',                 'fa-shirt',          TRUE,  FALSE),
  ('indumentaria', 'Campera',            'Campera impermeable del club',          'fa-shirt',          TRUE,  FALSE),
  ('indumentaria', 'Conjunto de arquero','Camiseta + Short arquero',              'fa-hand',           TRUE,  TRUE),
  -- Equipamiento de entrenamiento
  ('equipamiento', 'Pelota de fútbol N°5',    'Pelota reglamentaria',             'fa-futbol',         FALSE, FALSE),
  ('equipamiento', 'Pelota de fútbol N°4',    'Pelota categorías juveniles',      'fa-futbol',         FALSE, FALSE),
  ('equipamiento', 'Pelota de básquet',        'Pelota oficial básquet',          'fa-basketball',     FALSE, FALSE),
  ('equipamiento', 'Arco de fútbol',           'Arco reglamentario portátil',    'fa-square',         FALSE, FALSE),
  ('equipamiento', 'Vallas de atletismo',      'Vallas de 0.91 m',               'fa-minus',          FALSE, FALSE),
  ('equipamiento', 'Colchoneta',               'Colchoneta de gimnasia',         'fa-bed',            FALSE, FALSE),
  ('equipamiento', 'Conos',                    'Conos de entrenamiento',          'fa-traffic-cone',   FALSE, FALSE),
  ('equipamiento', 'Pecheras',                 'Pecheras de colores (x10)',       'fa-shirt',          FALSE, FALSE),
  ('equipamiento', 'Escalera de agilidad',     'Escalera de coordinación',       'fa-ruler-horizontal',FALSE,FALSE),
  ('equipamiento', 'Palos de salto',           'Para entrenamiento de salto',    'fa-arrows-up-down', FALSE, FALSE),
  -- Transporte
  ('transporte',   'Micro chico (20 pax)',     'Minibus para 20 pasajeros',      'fa-bus',            FALSE, FALSE),
  ('transporte',   'Micro mediano (40 pax)',   'Micro para 40 pasajeros',        'fa-bus',            FALSE, FALSE),
  ('transporte',   'Micro grande (60 pax)',    'Micro para 60 pasajeros',        'fa-bus-simple',     FALSE, FALSE),
  ('transporte',   'Camioneta',               'Camioneta para traslado de equipamiento','fa-truck',   FALSE, FALSE);

-- Cabecera de cada solicitud
CREATE TABLE solicitudes (
  id              INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT UNSIGNED   NOT NULL,
  tipo            ENUM('indumentaria','equipamiento','transporte') NOT NULL,
  estado          ENUM('pendiente','aprobada','rechazada','entregada') NOT NULL DEFAULT 'pendiente',
  fecha_necesidad DATE           NOT NULL,
  destino         VARCHAR(200),
  pasajeros       TINYINT UNSIGNED,
  observaciones   TEXT,
  creado_en       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sol_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_sol_usuario ON solicitudes(usuario_id);
CREATE INDEX idx_sol_estado  ON solicitudes(estado);

-- Ítems de cada solicitud
CREATE TABLE solicitud_items (
  id             INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  solicitud_id   INT UNSIGNED   NOT NULL,
  item_id        INT UNSIGNED   NOT NULL,
  cantidad       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  talle          VARCHAR(10),
  numero_dorsal  TINYINT UNSIGNED,
  observacion    VARCHAR(255),
  CONSTRAINT fk_solitem_solicitud FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id) ON DELETE CASCADE,
  CONSTRAINT fk_solitem_item      FOREIGN KEY (item_id)      REFERENCES catalogo_items(id)
);

-- Vista de solicitudes con detalle
CREATE OR REPLACE VIEW v_solicitudes AS
SELECT
  s.id, s.tipo, s.estado, s.fecha_necesidad, s.destino, s.pasajeros, s.observaciones, s.creado_en,
  CONCAT(u.nombre, ' ', u.apellido) AS solicitante,
  u.email,
  r.nombre AS rol_solicitante,
  COUNT(si.id) AS total_items
FROM solicitudes s
JOIN usuarios u ON u.id = s.usuario_id
JOIN roles    r ON r.id = u.rol_id
LEFT JOIN solicitud_items si ON si.solicitud_id = s.id
GROUP BY s.id;

