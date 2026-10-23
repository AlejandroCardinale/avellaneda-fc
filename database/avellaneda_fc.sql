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
  dni            VARCHAR(20)      UNIQUE,
  avatar_url     VARCHAR(255),
  activo         BOOLEAN          NOT NULL DEFAULT TRUE,
  creado_en      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ultimo_login   DATETIME,
  -- 'pendiente': esperando aprobacion | 'aprobado': puede iniciar sesion | 'rechazado': acceso denegado
  estado_registro ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'aprobado',
  CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- Si ya tens la tabla creada, ejecuta esto para agregar la columna:
-- ALTER TABLE usuarios ADD COLUMN estado_registro ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'aprobado';

CREATE INDEX idx_usuario_email ON usuarios(email);
CREATE INDEX idx_usuario_rol   ON usuarios(rol_id);

-- Datos de prueba — hashes bcrypt reales (salt 12)
-- Contraseñas:
--   admin@avellanedafc.com       → Admin1234!
--   entrenador1@avellanedafc.com → Entrenador1!
--   entrenador2@avellanedafc.com → Entrenador2!
--   atleta1/2/3@avellanedafc.com → Atleta1234!
INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono, dni, activo, estado_registro) VALUES
  (1, 'Carlos',  'Gomez',     'admin@avellanedafc.com',       '$2b$12$gcsQuOePQSO/6qbB3rpeYuP.NyBc1WWN3j4HWeXV.Omr6edpnuWOS', '1122334455', '30000001', TRUE, 'aprobado'),
  (2, 'Martin',  'Rodriguez', 'entrenador1@avellanedafc.com', '$2b$12$MIJ22SZbaiaBzBIZDC0BFOo4vSajZBUrR32HqqUTlBZeBADgXL4X.', '1133445566', '30000002', TRUE, 'aprobado'),
  (2, 'Lucia',   'Fernandez', 'entrenador2@avellanedafc.com', '$2b$12$rEcfrRPMKwHwnqrXoTA1EOJn6rZV9psKrRsEmc7A3Ni7vXFwwocNi', '1144556677', '30000003', TRUE, 'aprobado'),
  (3, 'Juan',    'Perez',     'atleta1@avellanedafc.com',     '$2b$12$a6kziXiNfPDl.HmPsrfipOk5K7qnktLSx3rt6s7.pXpraveJ6cKe2', '1155667788', '35000001', TRUE, 'aprobado'),
  (3, 'Sofia',   'Lopez',     'atleta2@avellanedafc.com',     '$2b$12$sYEEGzXZuqG0azmFBGry2..c/XvZjWbpGJZzAVESXIu5Ohu52yfU.', '1166778899', '35000002', TRUE, 'aprobado'),
  (3, 'Tomas',   'Garcia',    'atleta3@avellanedafc.com',     '$2b$12$nOLx.wLQgsc2bYD3wf/PD.lrQpZOTTlpobdGIIPzw8KK79V.DFLky', '1177889900', '35000003', TRUE, 'aprobado');

-- Cuentas de acceso confirmadas solicitadas para pruebas.
INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono, activo, estado_registro)
SELECT r.id, 'Entrenador', 'Avellaneda', 'enretenador@entrenador',
       '$2b$12$HCzCqtZURvpTP9dIPPK5GOPnpXZtOIGfnQhwLztkVXusx90swTtGW', NULL, TRUE, 'aprobado'
FROM roles r
WHERE r.nombre = 'entrenador'
  AND NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'enretenador@entrenador');

INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono, activo, estado_registro)
SELECT r.id, 'Admin', 'Avellaneda', 'admin@admin',
       '$2b$12$kmMp3DFzEepiX/Ki3IBR3udccuyGeGFRZHMZ.y74QocHAhlnG8nFe', NULL, TRUE, 'aprobado'
FROM roles r
WHERE r.nombre = 'administrador'
  AND NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@admin');

-- =============================================================
-- 3. DEPORTES
-- =============================================================
CREATE TABLE deportes (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre                   VARCHAR(60)  NOT NULL UNIQUE,
  tipo                     VARCHAR(60)  NULL DEFAULT 'Deportes',
  capacidad                INT UNSIGNED NULL DEFAULT 0,
  descripcion              TEXT,
  descripcion_larga        LONGTEXT,
  icono                    VARCHAR(50),
  imagen_url               VARCHAR(255),
  atletas_count            INT UNSIGNED NOT NULL DEFAULT 0,
  entrenadores_count       INT UNSIGNED NOT NULL DEFAULT 0,
  horario                  VARCHAR(200),
  caracteristicas          JSON,
  categorias               JSON,
  especificaciones_tecnicas JSON,
  equipamiento             JSON,
  normativas               JSON,
  activo                   BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO deportes (id, nombre, descripcion, descripcion_larga, icono, imagen_url, atletas_count, entrenadores_count, horario, caracteristicas, categorias, activo) VALUES
  (1, 'Fútbol', 'El deporte más popular del club. Contamos con categorías infantiles, juveniles y adultos para todos los niveles.', 'El fútbol es la disciplina insignia de Avellaneda FC. Desde sus inicios, el club ha formado a cientos de jugadores que hoy compiten en ligas locales y regionales. Nuestro programa formativo abarca desde la categoría Baby Fútbol hasta el plantel de Primera División adulta, con entrenamiento técnico, táctico y físico de alto nivel. Las canchas profesionales de césped natural y sintético permiten entrenar durante todo el año bajo las mejores condiciones.', 'fa-futbol', 'images/football_pitch.png', 120, 8, 'Lunes, Miércoles y Viernes 16:00 - 20:00', '["Canchas profesionales de césped natural y sintético", "Vestuarios renovados con duchas individuales", "Iluminación LED para entrenamientos nocturnos", "Sistema de video análisis para mejora táctica", "Equipo médico y de kinesiología en cada práctica"]', '["Baby Fútbol (5-7 años)", "Infantil (8-11 años)", "Cadetes (12-14 años)", "Juveniles (15-18 años)", "Sub-20", "Primera División Masculina", "Primera División Femenina"]', TRUE),
  (2, 'Natación', 'Piscina olímpica de 50 metros con clases para todas las edades. Desde bebés hasta adultos mayores.', 'La natación en Avellaneda FC cuenta con una piscina olímpica de 50 metros y una pileta de aprendizaje para los más pequeños. Ofrecemos clases para todas las edades y niveles, desde la estimulación temprana para bebés hasta la natación recreativa y competitiva para adultos. Nuestros profesores están certificados por la Federación Argentina de Natación y trabajan con metodologías modernas que garantizan una progresión segura y efectiva en el agua.', 'fa-water', 'images/pool.png', 85, 6, 'Todos los días 7:00 - 22:00', '["Piscina olímpica de 50 metros con 8 carriles", "Pileta de aprendizaje temperada para niños", "Temperatura controlada durante todo el año", "Sistema de purificación de agua de última generación", "Cronometraje electrónico para competencias"]', '["Estimulación acuática (6 meses - 2 años)", "Baby natación (3-4 años)", "Infantil (5-9 años)", "Junior (10-14 años)", "Adultos", "Adultos mayores", "Natación competitiva"]', TRUE),
  (3, 'Tenis', 'Canchas de polvo de ladrillo y pasto sintético. Clases individuales y grupales con profesores certificados.', 'El tenis en Avellaneda FC dispone de canchas de polvo de ladrillo y pasto sintético, ideales para jugadores de todos los estilos. Nuestros profesores certificados por la Asociación Argentina de Tenis brindan clases individuales y grupales para niños, jóvenes y adultos, con programas adaptados a cada nivel. El club también organiza torneos internos y participa en competencias zonales, brindando a los jugadores la posibilidad de medir su progreso.', 'fa-circle', 'images/tennis.png', 45, 4, 'Martes, Jueves y Sábados 9:00 - 18:00', '["4 canchas de polvo de ladrillo profesionales", "2 canchas de pasto sintético", "Iluminación para partidos nocturnos", "Maquinaria lanzapelotas para entrenamiento", "Pro shop con equipamiento y encordado"]', '["Mini tenis (4-7 años)", "Infantil (8-11 años)", "Juvenil (12-17 años)", "Adultos principiantes", "Adultos intermedios", "Adultos avanzados", "Clases individuales personalizadas"]', TRUE),
  (4, 'Gimnasio', 'Equipamiento de última generación, zona de pesas libre, cardio y clases de musculación con entrenadores.', 'El gimnasio de Avellaneda FC es un espacio de entrenamiento de alta performance con más de 600 m² de superficie. Contamos con equipamiento de última generación importado: máquinas de musculación, zona de pesas libres con barras olímpicas, plataformas de levantamiento, área cardiovascular con cintas, bicicletas y elípticas. Los entrenadores personales certificados elaboran planes de entrenamiento individualizados según los objetivos de cada socio.', 'fa-dumbbell', 'images/gym.png', 200, 10, 'Lunes a Sábado 6:00 - 22:00', '["Más de 600 m² de espacio de entrenamiento", "Zona de musculación con máquinas de última generación", "Área de pesas libres con plataformas olímpicas", "Sala cardiovascular con 30+ máquinas", "Salón de clases grupales (spinning, funcional, pilates)", "Vestuarios equipados con casilleros y duchas"]', '["Musculación y fuerza", "Entrenamiento funcional", "Cardio y resistencia", "Spinning", "Pilates", "Clases grupales", "Entrenamiento personal"]', TRUE),
  (5, 'Básquet', 'Disciplina con fuerte presencia en el club. Categorías menores, juveniles y primera división masculina y femenina.', 'El básquet es una de las disciplinas con mayor tradición en Avellaneda FC, con más de 30 años de historia competitiva. El club participa activamente en la liga zonal y ha formado a jugadores que lograron destacarse a nivel provincial. La escuela de básquet brinda formación integral desde los 7 años, trabajando valores como el trabajo en equipo, el respeto y la superación personal. Los equipos masculino y femenino de primera división compiten en divisionales regionales con buenos resultados.', 'fa-basketball', 'images/football_pitch.png', 60, 5, 'Lunes, Miércoles y Viernes 18:00 - 21:00', '["Cancha techada de madera reglamentaria", "Tableros con aro regulables para todas las alturas", "Sistema de marcador electrónico", "Gradería para 200 espectadores", "Vestuarios equipados para hombres y mujeres"]', '["Escuelita (7-9 años)", "Premini (10-11 años)", "Mini (12-13 años)", "U15 Masculino y Femenino", "U17 Masculino y Femenino", "Primera División Masculina", "Primera División Femenina"]', TRUE),
  (6, 'Vóley', 'Equipos masculinos y femeninos en competencia regional. Escuela de voleibol para niños desde los 8 años.', 'El vóley en Avellaneda FC cuenta con una sólida estructura formativa y competitiva. La escuela infantil recibe a niños desde los 8 años enseñando los fundamentos del juego en un ambiente divertido y motivador. Los equipos de adultos participan en la competencia regional con un plantel masculino y femenino bien consolidados. El club cuenta con canchas interiores de piso de madera y canchas de vóley playa para enriquecer la experiencia deportiva.', 'fa-volleyball-ball', 'images/football_pitch.png', 40, 3, 'Martes y Jueves 19:00 - 21:00', '["Cancha interior reglamentaria de piso de madera", "Cancha exterior de vóley playa", "Red electrónica con tensión regulable", "Entrenamiento con análisis de video", "Participación en torneos regionales y nacionales"]', '["Escuelita (8-10 años)", "Infantil (11-12 años)", "Cadetes (13-14 años)", "Juveniles (15-17 años)", "Primera División Masculina", "Primera División Femenina", "Vóley playa mixto"]', TRUE),
  (7, 'Atletismo', 'Pista de atletismo homologada con entrenadores especializados en velocidad, fondo y pruebas de campo.', 'La sección de atletismo de Avellaneda FC dispone de una pista homologada de 8 carriles donde se trabajan todas las especialidades olímpicas: velocidad (100m, 200m, 400m), medio fondo, fondo, salto en largo, salto en alto, triple salto, lanzamiento de bala, disco y jabalina. Nuestros entrenadores son ex-atletas de alto rendimiento con experiencia en competencias nacionales e internacionales, garantizando una formación de excelencia.', 'fa-person-running', 'images/football_pitch.png', 30, 3, 'Lunes a Viernes 7:00 - 9:00 y 17:00 - 19:00', '["Pista homologada de 400 metros con 8 carriles", "Zona de saltos con foso de arena profesional", "Área de lanzamientos equipada y señalizada", "Implementos reglamentarios (bala, disco, jabalina)", "Cronómetro electrónico y sistema de foto finish"]', '["Iniciación (8-11 años)", "Menores (12-14 años)", "Juveniles (15-17 años)", "Sub-23", "Mayores - Velocidad", "Mayores - Fondo y medio fondo", "Mayores - Pruebas de campo"]', TRUE),
  (8, 'Artes Marciales', 'Judo, Karate y Taekwondo con instructores certificados. Desarrollo de disciplina, respeto y habilidades de defensa personal.', 'Las Artes Marciales en Avellaneda FC comprenden tres disciplinas olímpicas: Judo, Karate y Taekwondo. Cada una cuenta con instructores certificados internacionalmente que transmiten no solo las técnicas de combate, sino también los valores fundamentales de disciplina, respeto, perseverancia y autocontrol. Los alumnos pueden participar en competencias interclubs, zonales y provinciales, logrando un desarrollo personal integral que trasciende el tatami.', 'fa-hand-fist', 'images/gym.png', 35, 4, 'Martes, Jueves y Sábados 10:00 - 12:00', '["Dojo equipado con tatami de goma de alta densidad", "Sala específica de Taekwondo con espejos", "Instructores con certificación internacional (Dan)", "Equipamiento de protección completo disponible", "Preparación para competencias federadas"]', '["Judo infantil (5-11 años)", "Judo juvenil y adultos", "Karate Shotokan (todas las edades)", "Taekwondo infantil (6-11 años)", "Taekwondo juvenil y adultos", "Defensa personal (adultos)", "Competencia federada"]', TRUE)
ON DUPLICATE KEY UPDATE
  nombre=VALUES(nombre), tipo=VALUES(tipo), capacidad=VALUES(capacidad),
  descripcion=VALUES(descripcion), descripcion_larga=VALUES(descripcion_larga),
  icono=VALUES(icono), imagen_url=VALUES(imagen_url), atletas_count=VALUES(atletas_count),
  entrenadores_count=VALUES(entrenadores_count), horario=VALUES(horario), caracteristicas=VALUES(caracteristicas),
  categorias=VALUES(categorias), especificaciones_tecnicas=VALUES(especificaciones_tecnicas),
  equipamiento=VALUES(equipamiento), normativas=VALUES(normativas), activo=VALUES(activo);

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

ALTER TABLE atletas
  ADD COLUMN IF NOT EXISTS entrenador_id INT UNSIGNED NULL,
  ADD CONSTRAINT fk_atleta_entrenador FOREIGN KEY (entrenador_id) REFERENCES entrenadores(id) ON DELETE SET NULL;

INSERT INTO entrenadores (usuario_id, deporte_id, especialidad, licencia) VALUES
  (2, 1, 'Futbol infantil y juvenil', 'LIC-001'),
  (3, 2, 'Natacion competitiva',      'LIC-002');

INSERT INTO entrenadores (usuario_id, deporte_id, especialidad, licencia)
SELECT u.id, d.id, 'Entrenamiento general', NULL
FROM usuarios u
JOIN deportes d ON d.nombre = 'Futbol'
WHERE u.email = 'enretenador@entrenador'
  AND NOT EXISTS (SELECT 1 FROM entrenadores WHERE usuario_id = u.id);

-- =============================================================
-- 6. INSTALACIONES
-- =============================================================
CREATE TABLE instalaciones (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre                   VARCHAR(80)  NOT NULL,
  descripcion              TEXT,
  descripcion_larga        LONGTEXT,
  icono                    VARCHAR(50),
  imagen_url               VARCHAR(255),
  capacidad                SMALLINT UNSIGNED,
  tipo                     VARCHAR(40),
  horario                  VARCHAR(200),
  caracteristicas          JSON,
  especificaciones_tecnicas JSON,
  normativas               JSON,
  equipamiento             JSON,
  activa                   BOOLEAN      NOT NULL DEFAULT TRUE
);

INSERT INTO instalaciones (id, nombre, descripcion, descripcion_larga, icono, imagen_url, capacidad, tipo, horario, caracteristicas, especificaciones_tecnicas, normativas, equipamiento, activa) VALUES
  (1, 'Cancha de Fútbol', 'Cancha de césped natural de dimensiones reglamentarias con iluminación LED para partidos nocturnos.', 'La cancha de fútbol de Avellaneda FC es el corazón del club. Con dimensiones reglamentarias y césped natural de alta calidad, ha sido escenario de cientos de partidos memorables a lo largo de la historia del club. La instalación cuenta con iluminación LED de alto rendimiento que permite la realización de entrenamientos y competencias nocturnas con visibilidad óptima. La tribuna cubierta con capacidad para 500 espectadores ofrece una experiencia inigualable para quienes siguen a sus equipos en casa.', 'fa-futbol', 'images/football_pitch.png', 500, 'Deportiva', 'Lunes a Viernes 9:00 - 22:00 / Sábados y Domingos 8:00 - 20:00', '["Césped natural reglamentario", "Iluminación LED", "Tribuna cubierta", "Vestuarios próximos"]', '[{"key": "Dimensiones", "value": "105 × 68 metros"}, {"key": "Superficie", "value": "Césped natural bermuda"}, {"key": "Iluminación", "value": "1500 lux (LED profesional)"}, {"key": "Capacidad tribuna", "value": "500 espectadores"}, {"key": "Año de remodelación", "value": "2023"}, {"key": "Norma", "value": "FIFA Quality Pro"}]', '["Obligatorio el uso de botines o zapatillas deportivas adecuadas", "Prohibido el ingreso con botines de tapones de metal", "El acceso a la cancha requiere autorización del personal del club", "Prohibido fumar y consumir alcohol dentro del predio", "Los menores de 14 años deben estar acompañados por un adulto"]', '["Arcos reglamentarios con redes", "Banderines de córner", "Tablero marcador electrónico", "Sistema de riego automático", "Banco de suplentes cubierto", "Mesa de control y cronometraje"]', TRUE),
  (2, 'Piscina Olímpica', 'Piscina olímpica de 50 metros con 8 carriles, temperatura regulada y sistema de filtrado de última generación.', 'La Piscina Olímpica de Avellaneda FC es una de las instalaciones acuáticas más completas de la región. Con sus 50 metros de longitud divididos en 8 carriles de competencia, ha sido sede de múltiples torneos provinciales de natación. El sistema de climatización mantiene el agua a temperatura constante de 26-28°C durante todo el año, permitiendo el uso pleno de las instalaciones independientemente de la estación. Una pileta auxiliar temperada de 25 metros complementa la oferta para la enseñanza de natación a niños y principiantes.', 'fa-water', 'images/pool.png', 300, 'Acuática', 'Lunes a Viernes 6:30 - 22:00 / Sábados 7:00 - 20:00 / Domingos 8:00 - 18:00', '["50 metros / 8 carriles", "Temperatura regulada", "Tribuna de espectadores", "Trampolín y plataforma"]', '[{"key": "Largo", "value": "50 metros"}, {"key": "Ancho", "value": "25 metros (8 carriles)"}, {"key": "Profundidad", "value": "1.80m a 2.00m"}, {"key": "Temperatura", "value": "26-28 °C"}, {"key": "Sistema de filtrado", "value": "Ultravioleta + cloración automática"}, {"key": "Norma", "value": "FINA / World Aquatics"}]', '["Obligatorio el uso de gorro de natación en todo momento", "Obligatorio ducharse antes de ingresar al agua", "Prohibido correr en el área de la piscina", "Prohibido el ingreso con comida o bebidas al área acuática", "Los niños menores de 8 años deben estar acompañados por un adulto", "Respetar los carriles asignados según el nivel de natación"]', '["Bloques de salida de competencia", "Cronómetro electrónico con foto finish", "Corcheras de separación de carriles", "Trampolín de 1 metro y plataforma de 3 metros", "Tablas y pull-buoys para entrenamiento", "Sistema de megafonía para competencias"]', TRUE),
  (3, 'Gimnasio', 'Más de 800m² con equipamiento de última generación. Zona de musculación, cardio y clases grupales.', 'El Gimnasio de Avellaneda FC es un espacio de entrenamiento de alta performance con más de 800 m² distribuidos en tres zonas especializadas. La sala de musculación cuenta con el equipamiento más moderno del mercado, importado de marcas líderes como Technogym y Life Fitness. La zona cardiovascular ofrece más de 30 máquinas de última generación con pantallas individuales integradas. El salón de clases grupales se usa para spinning, entrenamiento funcional, pilates, yoga y zumba, con capacidad para 25 personas simultáneas.', 'fa-dumbbell', 'images/gym.png', 80, 'Fitness', 'Lunes a Viernes 6:00 - 23:00 / Sábados 7:00 - 21:00 / Domingos 8:00 - 20:00', '["800m² de superficie", "Equipos de última generación", "Zona cardio y musculación", "Clases grupales incluidas"]', '[{"key": "Superficie total", "value": "800 m²"}, {"key": "Zona musculación", "value": "400 m²"}, {"key": "Zona cardiovascular", "value": "200 m²"}, {"key": "Salón clases grupales", "value": "200 m²"}, {"key": "Capacidad simultánea", "value": "80 personas"}, {"key": "Año de equipamiento", "value": "2024"}]', '["Obligatorio el uso de ropa deportiva y zapatillas cerradas", "Obligatorio el uso de toalla personal en todas las máquinas", "Limpiar el equipo con el spray desinfectante provisto después de su uso", "Respetar los turnos de uso de las máquinas en horarios pico", "Prohibido el ingreso con bolsos grandes al área de entrenamiento", "Los menores de 16 años deben tener autorización médica y de sus padres"]', '["Máquinas de musculación Technogym (20 unidades)", "Barras olímpicas y plataformas de levantamiento", "Mancuernas de 2 a 60 kg", "Cintas de correr con pantalla táctil (10 unidades)", "Bicicletas estáticas y spinning (15 unidades)", "Elípticas y remos (8 unidades)", "Sistema de audio y climatización independiente"]', TRUE),
  (4, 'Canchas de Tenis', 'Seis canchas profesionales (4 clay + 2 pasto sintético) con iluminación LED. Superficies variadas para adaptarse a todos los estilos de juego.', 'El complejo de tenis de Avellaneda FC cuenta con seis canchas profesionales que cubren las principales superficies de juego: polvo de ladrillo (clay), pasto sintético y superficie dura. Esta variedad permite que los jugadores desarrollen habilidades completas y se adapten a cualquier tipo de torneo. Las canchas están numeradas del 1 al 6 y todas cuentan con iluminación LED para partidos nocturnos. El pro shop del club ofrece encordado profesional, venta y alquiler de raquetas, y accesorios de la marca Wilson y Head.', 'fa-circle', 'images/tennis.png', 40, 'Deportiva', 'Lunes a Viernes 7:00 - 23:00 / Sábados 7:00 - 22:00 / Domingos 8:00 - 20:00', '["6 canchas (4 clay + 2 sintético)", "Polvo de ladrillo y sintético", "Iluminación nocturna", "Alquiler de raquetas"]', '[{"key": "Cantidad de canchas", "value": "6 (4 clay + 2 sintético)"}, {"key": "Dimensiones", "value": "23.77 × 10.97 metros"}, {"key": "Superficie clay", "value": "Polvo de ladrillo certificado"}, {"key": "Superficie sintética", "value": "Pasto sintético GreenSet"}, {"key": "Iluminación", "value": "500 lux (LED)"}, {"key": "Norma", "value": "ITF - International Tennis Federation"}]', '["Obligatorio el uso de zapatillas específicas para tenis (no running)", "En canchas de polvo de ladrillo, respetar el marcado con las líneas", "Reservar la cancha con mínimo 24 horas de anticipación", "Máximo 2 horas de uso consecutivo por turno en horarios pico", "Las pelotas deben comprarse o alquilarse en el pro shop del club", "Prohibido el ingreso a las canchas con alimentos o bebidas con azúcar"]', '["Redes reglamentarias ajustables", "Máquina lanzapelotas automática (disponible para alquiler)", "Sillas de árbitro con parasol", "Tablero de puntuación manual y electrónico", "Stock de pelotas Wilson y Head para alquiler", "Raquetas de diferentes niveles para alquiler"]', TRUE),
  (5, 'Polideportivo', 'Cancha cubierta multiuso para básquet, vóley y eventos deportivos.', 'El Polideportivo Cubierto de Avellaneda FC es un recinto cerrado multipropósito con piso de parquet flotante de alta competencia. Con capacidad para más de 500 espectadores en sus graderías laterales, es la sede oficial de los partidos de la liga regional de básquet y vóley. Cuenta con tableros electrónicos, vestuarios exclusivos para equipos locales y visitantes, y sistema de sonido integral para competencias y actos institucionales.', 'fa-building', 'images/football_pitch.png', 500, 'Deportiva', 'Lunes a Sábado 8:00 - 22:00 / Domingos según calendario de partidos', '["Piso de parquet flotante", "Capacidad 500 espectadores", "Marcador electrónico", "Vestuarios independientes"]', '[{"key": "Superficie total", "value": "1200 m²"}, {"key": "Tipo de piso", "value": "Parquet flotante amortiguado"}, {"key": "Capacidad tribunas", "value": "500 espectadores"}, {"key": "Iluminación", "value": "1200 lux LED"}, {"key": "Norma", "value": "FIBA / FIVB"}]', '["Obligatorio el uso de calzado deportivo con suela de goma limpia (no manchar)", "Prohibido el ingreso con alimentos o bebidas excepto agua", "Respetar las zonas delimitadas para jugadores y espectadores", "El uso de las instalaciones debe ser coordinado con el departamento deportivo"]', '["Tableros de básquet hidráulicos reglamentarios", "Juego de postes y redes de vóley de alta tensión", "Marcador electrónico digital con consola central", "Bancos de suplentes y mesa de control", "Sistema de sonido y altoparlantes"]', TRUE)
ON DUPLICATE KEY UPDATE
  nombre=VALUES(nombre), descripcion=VALUES(descripcion), descripcion_larga=VALUES(descripcion_larga),
  icono=VALUES(icono), imagen_url=VALUES(imagen_url), capacidad=VALUES(capacidad), tipo=VALUES(tipo),
  horario=VALUES(horario), caracteristicas=VALUES(caracteristicas), especificaciones_tecnicas=VALUES(especificaciones_tecnicas),
  normativas=VALUES(normativas), equipamiento=VALUES(equipamiento), activa=VALUES(activa);

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
  contenido      LONGTEXT     NULL,
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
-- 14. TOKENS DE RECUPERACION DE CONTRASENA
-- =============================================================
CREATE TABLE password_reset_tokens (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NOT NULL,
  token      VARCHAR(64)  NOT NULL UNIQUE,   -- crypto.randomBytes(32).toString('hex')
  expira_en  DATETIME     NOT NULL,          -- NOW() + 1 hora
  usado      BOOLEAN      NOT NULL DEFAULT FALSE,
  creado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prt_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_prt_token    ON password_reset_tokens(token);
CREATE INDEX idx_prt_usuario  ON password_reset_tokens(usuario_id);


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

-- ============================================================
-- TABLA: eventos (Agenda institucional, deportiva y social del club)
-- ============================================================
CREATE TABLE IF NOT EXISTS eventos (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo                   VARCHAR(120) NOT NULL,
  descripcion              TEXT,
  descripcion_larga        LONGTEXT,
  fecha_hora               DATETIME NOT NULL,
  hora_fin                 VARCHAR(30),
  lugar                    VARCHAR(120),
  lugar_detalle            VARCHAR(255),
  disciplina               VARCHAR(60) DEFAULT 'General',
  categoria                VARCHAR(60) DEFAULT 'Sociales',
  imagen_url               VARCHAR(255) DEFAULT 'images/football_pitch.png',
  cronograma               LONGTEXT,
  categorias_participantes LONGTEXT,
  inscripcion_abierta      TINYINT(1) NOT NULL DEFAULT 1,
  inscripcion_limite       VARCHAR(120),
  inscripcion_contacto     VARCHAR(120),
  reglas                   LONGTEXT,
  premios                  LONGTEXT,
  destacado                TINYINT(1) NOT NULL DEFAULT 0,
  publicado                TINYINT(1) NOT NULL DEFAULT 1,
  creado_por               INT UNSIGNED NOT NULL DEFAULT 1,
  creado_en                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_eventos_fecha (fecha_hora),
  INDEX idx_eventos_categoria (categoria),
  INDEX idx_eventos_publicado (publicado)
);

