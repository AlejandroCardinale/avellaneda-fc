/**
 * ============================================================
 * MIGRATE-DEPORTES.JS — Migración independiente para Deportes
 * ============================================================
 * Proyecto: Avellaneda FC
 *
 * Responsabilidades:
 *  1. Cargar la configuración de base de datos desde backend/.env
 *  2. Conectar a MySQL reutilizando el pool del backend (o creando conexión fallback)
 *  3. Verificar y asegurar la estructura completa de la tabla `deportes`
 *  4. Poblar / actualizar las 8 disciplinas deportivas oficiales con datos completos:
 *     - Especificaciones técnicas (formato clave-valor)
 *     - Equipamiento provisto
 *     - Reglamento y normativas
 *     - Características, categorías, horarios, atletas, entrenadores
 *  5. Sincronizar las categorías en la tabla `categorias`
 *  6. Notificar el éxito por consola
 *
 * Ejecución:
 *  node database/migrate-deportes.js
 * ============================================================
 */

const path = require('path');
// Asegurar que encuentre las dependencias instaladas en backend/node_modules
module.paths.push(path.join(__dirname, '..', 'backend', 'node_modules'));

require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
require('dotenv').config();

let pool;
try {
  pool = require('../backend/db');
} catch (err) {
  const mysql = require('mysql2/promise');
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'avellaneda_fc',
    waitForConnections: true,
    connectionLimit: 5
  });
}

const DEPORTES_DATA = [
  {
    id: 1,
    nombre: 'Fútbol',
    icono: 'fa-futbol',
    tipo: 'Deportes de equipo',
    capacidad: 500,
    descripcion: 'El deporte más popular del club. Contamos con categorías infantiles, juveniles y adultos para todos los niveles.',
    descripcion_larga: 'El fútbol es la disciplina insignia de Avellaneda FC. Desde sus inicios, el club ha formado a cientos de jugadores que hoy compiten en ligas locales y regionales. Nuestro programa formativo abarca desde la categoría Baby Fútbol hasta el plantel de Primera División adulta, con entrenamiento técnico, táctico y físico de alto nivel. Las canchas profesionales de césped natural y sintético permiten entrenar durante todo el año bajo las mejores condiciones.',
    imagen_url: 'images/football_pitch.png',
    atletas_count: 120,
    entrenadores_count: 8,
    horario: 'Lunes, Miércoles y Viernes 16:00 - 20:00',
    caracteristicas: [
      'Canchas profesionales de césped natural y sintético',
      'Vestuarios renovados con duchas individuales',
      'Iluminación LED para entrenamientos nocturnos',
      'Sistema de video análisis para mejora táctica',
      'Equipo médico y de kinesiología en cada práctica'
    ],
    categorias: [
      'Baby Fútbol (5-7 años)',
      'Infantil (8-11 años)',
      'Cadetes (12-14 años)',
      'Juveniles (15-18 años)',
      'Sub-20',
      'Primera División Masculina',
      'Primera División Femenina'
    ],
    especificaciones_tecnicas: [
      { key: 'Superficie', value: 'Césped natural y sintético profesional' },
      { key: 'Dimensiones', value: '105 x 68 m (reglamentaria AFA/FIFA)' },
      { key: 'Iluminación', value: '800 lux LED homologada para partidos nocturnos' },
      { key: 'Capacidad tribunas', value: '500 espectadores sentados' }
    ],
    equipamiento: [
      'Pelotas oficiales AFA para entrenamiento y partidos',
      'Conos, vallas y elementos de coordinación física',
      'Pecheras de entrenamiento diferenciadas por colores',
      'Arcos reglamentarios de aluminio con redes reforzadas',
      'Botiquín de primeros auxilios y camilla de traslado'
    ],
    normativas: [
      'Apto médico vigente obligatorio para entrenar y competir',
      'Uso obligatorio de canilleras en todos los entrenamientos y partidos',
      'Puntualidad en los horarios de entrenamiento (10 min de anticipación)',
      'Cuidado estricto de las instalaciones y el material deportivo provisto'
    ]
  },
  {
    id: 2,
    nombre: 'Natación',
    icono: 'fa-water',
    tipo: 'Deportes acuáticos',
    capacidad: 150,
    descripcion: 'Piscina olímpica de 50 metros con clases para todas las edades. Desde bebés hasta adultos mayores.',
    descripcion_larga: 'La natación en Avellaneda FC cuenta con una piscina olímpica de 50 metros y una pileta de aprendizaje para los más pequeños. Ofrecemos clases para todas las edades y niveles, desde la estimulación temprana para bebés hasta la natación recreativa y competitiva para adultos. Nuestros profesores están certificados por la Federación Argentina de Natación y trabajan con metodologías modernas que garantizan una progresión segura y efectiva en el agua.',
    imagen_url: 'images/pool.png',
    atletas_count: 85,
    entrenadores_count: 6,
    horario: 'Todos los días 7:00 - 22:00',
    caracteristicas: [
      'Piscina olímpica de 50 metros con 8 carriles',
      'Pileta de aprendizaje temperada para niños',
      'Temperatura controlada durante todo el año',
      'Sistema de purificación de agua de última generación',
      'Cronometraje electrónico para competencias'
    ],
    categorias: [
      'Estimulación acuática (6 meses - 2 años)',
      'Baby natación (3-4 años)',
      'Infantil (5-9 años)',
      'Junior (10-14 años)',
      'Adultos',
      'Adultos mayores',
      'Natación competitiva'
    ],
    especificaciones_tecnicas: [
      { key: 'Longitud', value: '50 metros olímpica' },
      { key: 'Carriles', value: '8 andariveles reglamentarios con rompeolas' },
      { key: 'Profundidad', value: '1.40 m a 2.20 m' },
      { key: 'Temperatura', value: '27°C - 28°C climatizada todo el año' },
      { key: 'Tratamiento', value: 'Filtrado continuo y cloración salina' }
    ],
    equipamiento: [
      'Tablas de flotación y pull buoys para técnica',
      'Aletas y manoplas de natación ergonómicas',
      'Andariveles anti-turbulencia homologados',
      'Cronómetro digital de pared de 4 cuadrantes',
      'Equipos de rescate y salvavidas acuáticos'
    ],
    normativas: [
      'Revisión médica y apto físico acuático obligatorio cada 30 días',
      'Uso obligatorio de gorro de natación y ojotas en el perímetro',
      'Ducha previa obligatoria antes de ingresar a la pileta',
      'Prohibido correr en el sector de bordes y vestuarios'
    ]
  },
  {
    id: 3,
    nombre: 'Tenis',
    icono: 'fa-circle',
    tipo: 'Deportes de raqueta',
    capacidad: 80,
    descripcion: 'Canchas de polvo de ladrillo y pasto sintético. Clases individuales y grupales con profesores certificados.',
    descripcion_larga: 'El tenis en Avellaneda FC dispone de canchas de polvo de ladrillo y pasto sintético, ideales para jugadores de todos los estilos. Nuestros profesores certificados por la Asociación Argentina de Tenis brindan clases individuales y grupales para niños, jóvenes y adultos, con programas adaptados a cada nivel. El club también organiza torneos internos y participa en competencias zonales, brindando a los jugadores la posibilidad de medir su progreso.',
    imagen_url: 'images/tennis.png',
    atletas_count: 45,
    entrenadores_count: 4,
    horario: 'Martes, Jueves y Sábados 9:00 - 18:00',
    caracteristicas: [
      '4 canchas de polvo de ladrillo profesionales',
      '2 canchas de pasto sintético',
      'Iluminación para partidos nocturnos',
      'Maquinaria lanzapelotas para entrenamiento',
      'Pro shop con equipamiento y encordado'
    ],
    categorias: [
      'Mini tenis (4-7 años)',
      'Infantil (8-11 años)',
      'Juvenil (12-17 años)',
      'Adultos principiantes',
      'Adultos intermedios',
      'Adultos avanzados',
      'Clases individuales personalizadas'
    ],
    especificaciones_tecnicas: [
      { key: 'Canchas totales', value: '6 canchas (4 polvo de ladrillo + 2 sintéticas)' },
      { key: 'Superficie clay', value: 'Tierra batida / polvo de ladrillo compactado' },
      { key: 'Iluminación', value: 'LED focalizado para competencia nocturna' },
      { key: 'Mantenimiento', value: 'Riego y rastrillado automatizado diario' }
    ],
    equipamiento: [
      'Redes reglamentarias con bandas de lona ajustables',
      'Máquina lanzapelotas automática para clases técnicas',
      'Sillas de árbitro y bancos de descanso techados',
      'Rastrillos y zunchos de barrido para socios',
      'Stock de pelotas y raquetas para alquiler'
    ],
    normativas: [
      'Uso obligatorio de calzado específico de suela plana para polvo de ladrillo',
      'Pasar el rastrillo y barrer líneas al finalizar el turno',
      'Reserva previa de cancha con un mínimo de 24 horas',
      'Vestimenta deportiva blanca o reglamentaria de tenis'
    ]
  },
  {
    id: 4,
    nombre: 'Gimnasio',
    icono: 'fa-dumbbell',
    tipo: 'Fitness y Musculación',
    capacidad: 200,
    descripcion: 'Equipamiento de última generación, zona de pesas libre, cardio y clases de musculación con entrenadores.',
    descripcion_larga: 'El gimnasio de Avellaneda FC es un espacio de entrenamiento de alta performance con más de 600 m² de superficie. Contamos con equipamiento de última generación importado: máquinas de musculación, zona de pesas libres con barras olímpicas, plataformas de levantamiento, área cardiovascular con cintas, bicicletas y elípticas. Los entrenadores personales certificados elaboran planes de entrenamiento individualizados según los objetivos de cada socio.',
    imagen_url: 'images/gym.png',
    atletas_count: 200,
    entrenadores_count: 10,
    horario: 'Lunes a Sábado 6:00 - 22:00',
    caracteristicas: [
      'Más de 600 m² de espacio de entrenamiento',
      'Zona de musculación con máquinas de última generación',
      'Área de pesas libres con plataformas olímpicas',
      'Sala cardiovascular con 30+ máquinas',
      'Salón de clases grupales (spinning, funcional, pilates)',
      'Vestuarios equipados con casilleros y duchas'
    ],
    categorias: [
      'Musculación y fuerza',
      'Entrenamiento funcional',
      'Cardio y resistencia',
      'Spinning',
      'Pilates',
      'Clases grupales',
      'Entrenamiento personal'
    ],
    especificaciones_tecnicas: [
      { key: 'Superficie', value: '600 m² climatizados' },
      { key: 'Piso', value: 'Goma de alto impacto y plataformas olímpicas' },
      { key: 'Equipos', value: 'Más de 50 estaciones de fuerza y cardio' },
      { key: 'Ventilación', value: 'Sistema de renovación de aire y aire acondicionado central' }
    ],
    equipamiento: [
      'Mancuernas de 1 kg a 50 kg y barras olímpicas homologadas',
      'Discos de caucho bumper para levantamiento olímpico',
      'Máquinas selectorizadas de musculación de última generación',
      'Cintas de correr, bicicletas fijas y elípticas de alta gama',
      'Colchonetas, bandas elásticas, kettlebells y balones medicinales'
    ],
    normativas: [
      'Uso obligatorio de toalla personal en todas las máquinas',
      'Descargar y ordenar las barras y mancuernas luego de utilizarlas',
      'Prohibido entrenar con calzado inapropiado o con el torso descubierto',
      'Respetar la alternancia de máquinas en horarios de alta concurrencia'
    ]
  },
  {
    id: 5,
    nombre: 'Básquet',
    icono: 'fa-basketball',
    tipo: 'Deportes de equipo',
    capacidad: 300,
    descripcion: 'Disciplina con fuerte presencia en el club. Categorías menores, juveniles y primera división masculina y femenina.',
    descripcion_larga: 'El básquet es una de las disciplinas con mayor tradición en Avellaneda FC, con más de 30 años de historia competitiva. El club participa activamente en la liga zonal y ha formado a jugadores que lograron destacarse a nivel provincial. La escuela de básquet brinda formación integral desde los 7 años, trabajando valores como el trabajo en equipo, el respeto y la superación personal. Los equipos masculino y femenino de primera división compiten en divisionales regionales con buenos resultados.',
    imagen_url: 'images/football_pitch.png',
    atletas_count: 60,
    entrenadores_count: 5,
    horario: 'Lunes, Miércoles y Viernes 18:00 - 21:00',
    caracteristicas: [
      'Cancha techada de madera reglamentaria',
      'Tableros con aro regulables para todas las alturas',
      'Sistema de marcador electrónico',
      'Gradería para 200 espectadores',
      'Vestuarios equipados para hombres y mujeres'
    ],
    categorias: [
      'Escuelita (7-9 años)',
      'Premini (10-11 años)',
      'Mini (12-13 años)',
      'U15 Masculino y Femenino',
      'U17 Masculino y Femenino',
      'Primera División Masculina',
      'Primera División Femenina'
    ],
    especificaciones_tecnicas: [
      { key: 'Superficie', value: 'Piso de madera flotante guatambú homologado FIBA' },
      { key: 'Dimensiones', value: '28 x 15 m reglamentarias' },
      { key: 'Tableros', value: 'Cristal templado con aros rebatibles y protección acolchada' },
      { key: 'Marcador', value: 'Electrónico de 4 caras con reloj de 24 segundos' }
    ],
    equipamiento: [
      'Pelotas de básquet Molten reglamentarias N° 5, 6 y 7',
      'Conos, escaleras de agilidad y paracaídas de velocidad',
      'Pecheras de entrenamiento para partidos internos',
      'Mesa de control oficial con planillaje digital'
    ],
    normativas: [
      'Ingresar únicamente con zapatillas de básquet limpias (suela no marcante)',
      'Prohibido colgarse de los aros fuera de situaciones de juego reglamentarias',
      'No ingresar alimentos ni bebidas azucaradas al parquet',
      'Apto físico al día para participar de entrenamientos'
    ]
  },
  {
    id: 6,
    nombre: 'Vóley',
    icono: 'fa-volleyball-ball',
    tipo: 'Deportes de equipo',
    capacidad: 250,
    descripcion: 'Equipos masculinos y femeninos en competencia regional. Escuela de voleibol para niños desde los 8 años.',
    descripcion_larga: 'El vóley en Avellaneda FC cuenta con una sólida estructura formativa y competitiva. La escuela infantil recibe a niños desde los 8 años enseñando los fundamentos del juego en un ambiente divertido y motivador. Los equipos de adultos participan en la competencia regional con un plantel masculino y femenino bien consolidados. El club cuenta con canchas interiores de piso de madera y canchas de vóley playa para enriquecer la experiencia deportiva.',
    imagen_url: 'images/football_pitch.png',
    atletas_count: 40,
    entrenadores_count: 3,
    horario: 'Martes y Jueves 19:00 - 21:00',
    caracteristicas: [
      'Cancha interior reglamentaria de piso de madera',
      'Cancha exterior de vóley playa',
      'Red electrónica con tensión regulable',
      'Entrenamiento con análisis de video',
      'Participación en torneos regionales y nacionales'
    ],
    categorias: [
      'Escuelita (8-10 años)',
      'Infantil (11-12 años)',
      'Cadetes (13-14 años)',
      'Juveniles (15-17 años)',
      'Primera División Masculina',
      'Primera División Femenina',
      'Vóley playa mixto'
    ],
    especificaciones_tecnicas: [
      { key: 'Superficie', value: 'Piso amortiguado de competencia' },
      { key: 'Dimensiones', value: '18 x 9 m con zona libre de 3 m' },
      { key: 'Red', value: 'Reglamentaria con varillas y postes acolchados' },
      { key: 'Iluminación', value: '1000 lux uniforme sin encandilamiento' }
    ],
    equipamiento: [
      'Pelotas Mikasa y Penalty reglamentarias de competición',
      'Postes telescópicos ajustables a alturas femenina, masculina y juvenil',
      'Silla de árbitro oficial con protección acolchada',
      'Carros porta balones y bandas elásticas de salto'
    ],
    normativas: [
      'Zapatillas deportivas de interior limpias',
      'Uso de rodilleras reglamentarias en entrenamientos y partidos',
      'Respetar las indicaciones de los entrenadores y árbitros',
      'Acreditar apto médico antes de iniciar la pretemporada'
    ]
  },
  {
    id: 7,
    nombre: 'Atletismo',
    icono: 'fa-person-running',
    tipo: 'Atletismo y Campo',
    capacidad: 400,
    descripcion: 'Pista de atletismo homologada con entrenadores especializados en velocidad, fondo y pruebas de campo.',
    descripcion_larga: 'La sección de atletismo de Avellaneda FC dispone de una pista homologada de 8 carriles donde se trabajan todas las especialidades olímpicas: velocidad (100m, 200m, 400m), medio fondo, fondo, salto en largo, salto en alto, triple salto, lanzamiento de bala, disco y jabalina. Nuestros entrenadores son ex-atletas de alto rendimiento con experiencia en competencias nacionales e internacionales, garantizando una formación de excelencia.',
    imagen_url: 'images/football_pitch.png',
    atletas_count: 30,
    entrenadores_count: 3,
    horario: 'Lunes a Viernes 7:00 - 9:00 y 17:00 - 19:00',
    caracteristicas: [
      'Pista homologada de 400 metros con 8 carriles',
      'Zona de saltos con foso de arena profesional',
      'Área de lanzamientos equipada y señalizada',
      'Implementos reglamentarios (bala, disco, jabalina)',
      'Cronómetro electrónico y sistema de foto finish'
    ],
    categorias: [
      'Iniciación (8-11 años)',
      'Menores (12-14 años)',
      'Juveniles (15-17 años)',
      'Sub-23',
      'Mayores - Velocidad',
      'Mayores - Fondo y medio fondo',
      'Mayores - Pruebas de campo'
    ],
    especificaciones_tecnicas: [
      { key: 'Pista', value: '400 m de tartán homologada con 8 carriles' },
      { key: 'Zona de saltos', value: 'Fosos de arena para salto en largo y triple' },
      { key: 'Lanzamientos', value: 'Jaula de protección para disco y martillo' },
      { key: 'Cronometraje', value: 'Sistema de fotofinish electrónico' }
    ],
    equipamiento: [
      'Vallas de altura regulable para velocidad y salto',
      'Balas, discos, jabalinas y martillos de pesos oficiales',
      'Colchoneta reglamentaria para salto en alto',
      'Tacos de partida de aluminio ajustables',
      'Cintas métricas de fibra de vidrio y anemómetro'
    ],
    normativas: [
      'Correr siempre en el sentido reglamentario de la pista (antihorario)',
      'Los carriles interiores 1 y 2 están reservados para pasadas de velocidad',
      'Uso obligatorio de clavos permitidos (máx. 6 mm)',
      'Ingresar al sector de lanzamientos solo bajo supervisión directa del docente'
    ]
  },
  {
    id: 8,
    nombre: 'Artes Marciales',
    icono: 'fa-hand-fist',
    tipo: 'Deportes de combate',
    capacidad: 100,
    descripcion: 'Judo, Karate y Taekwondo con instructores certificados. Desarrollo de disciplina, respeto y habilidades de defensa personal.',
    descripcion_larga: 'Las Artes Marciales en Avellaneda FC comprenden tres disciplinas olímpicas: Judo, Karate y Taekwondo. Cada una cuenta con instructores certificados internacionalmente que transmiten no solo las técnicas de combate, sino también los valores fundamentales de disciplina, respeto, perseverancia y autocontrol. Los alumnos pueden participar en competencias interclubs, zonales y provinciales, logrando un desarrollo personal integral que trasciende el tatami.',
    imagen_url: 'images/gym.png',
    atletas_count: 35,
    entrenadores_count: 4,
    horario: 'Martes, Jueves y Sábados 10:00 - 12:00',
    caracteristicas: [
      'Dojo equipado con tatami de goma de alta densidad',
      'Sala específica de Taekwondo con espejos',
      'Instructores con certificación internacional (Dan)',
      'Equipamiento de protección completo disponible',
      'Preparación para competencias federadas'
    ],
    categorias: [
      'Judo infantil (5-11 años)',
      'Judo juvenil y adultos',
      'Karate Shotokan (todas las edades)',
      'Taekwondo infantil (6-11 años)',
      'Taekwondo juvenil y adultos',
      'Defensa personal (adultos)',
      'Competencia federada'
    ],
    especificaciones_tecnicas: [
      { key: 'Dojo', value: 'Superficie de tatami de alta densidad de 120 m²' },
      { key: 'Paredes', value: 'Protección perimetral acolchada de seguridad' },
      { key: 'Espejos', value: 'Paredes espejadas para corrección técnica y katas' },
      { key: 'Ventilación', value: 'Ambiente climatizado con circulación de aire forzada' }
    ],
    equipamiento: [
      'Bolsas de boxeo, puching balls y paos de golpeo',
      'Escudos de potencia y focos de precisión',
      'Cascos, pecheras, canilleras y guantines homologados',
      'Cinturones de graduación y tatamis de práctica'
    ],
    normativas: [
      'Reverencia de respeto (Rei) al ingresar y salir del tatami',
      'Higiene rigurosa: uñas cortas y judogi/karategi/dobok limpio',
      'Prohibido el uso de calzado, anillos, pulseras o cadenas sobre el tatami',
      'Guardar silencio y atención a las indicaciones de los Sensei'
    ]
  }
];

async function columnExists(connection, tableName, columnName) {
  const [cols] = await connection.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
  `, [tableName, columnName]);
  return cols.length > 0;
}

async function addColumnIfMissing(connection, tableName, columnName, columnDefinition) {
  const exists = await columnExists(connection, tableName, columnName);
  if (!exists) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`);
    console.log(`  ➕ Columna añadida: ${columnName} en ${tableName}`);
  }
}

async function runMigration() {
  const connection = await pool.getConnection();
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚽ AVELLANEDA FC — Migración de Disciplinas Deportivas');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Conectado a la base de datos:', process.env.DB_NAME || 'avellaneda_fc');

    // 1. Asegurar tabla deportes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS deportes (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(60) NOT NULL UNIQUE,
        descripcion TEXT,
        icono VARCHAR(50),
        imagen_url VARCHAR(255),
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Verificar y agregar columnas extendidas
    await addColumnIfMissing(connection, 'deportes', 'tipo', "VARCHAR(60) NULL DEFAULT 'Deportes'");
    await addColumnIfMissing(connection, 'deportes', 'capacidad', 'INT UNSIGNED NULL DEFAULT 0');
    await addColumnIfMissing(connection, 'deportes', 'descripcion_larga', 'LONGTEXT NULL');
    await addColumnIfMissing(connection, 'deportes', 'horario', 'VARCHAR(200) NULL');
    await addColumnIfMissing(connection, 'deportes', 'caracteristicas', 'JSON NULL');
    await addColumnIfMissing(connection, 'deportes', 'categorias', 'JSON NULL');
    await addColumnIfMissing(connection, 'deportes', 'atletas_count', 'INT UNSIGNED NOT NULL DEFAULT 0');
    await addColumnIfMissing(connection, 'deportes', 'entrenadores_count', 'INT UNSIGNED NOT NULL DEFAULT 0');
    await addColumnIfMissing(connection, 'deportes', 'especificaciones_tecnicas', 'JSON NULL');
    await addColumnIfMissing(connection, 'deportes', 'equipamiento', 'JSON NULL');
    await addColumnIfMissing(connection, 'deportes', 'normativas', 'JSON NULL');

    // 3. Poblar / Actualizar cada disciplina deportiva
    console.log('\n📦 Actualizando disciplinas deportivas con especificaciones, equipamiento y normativas...');
    for (const d of DEPORTES_DATA) {
      const jsonFeatures = JSON.stringify(d.caracteristicas);
      const jsonCategories = JSON.stringify(d.categorias);
      const jsonSpecs = JSON.stringify(d.especificaciones_tecnicas || []);
      const jsonEquipment = JSON.stringify(d.equipamiento || []);
      const jsonRegulations = JSON.stringify(d.normativas || []);

      const [existing] = await connection.query('SELECT id FROM deportes WHERE id = ?', [d.id]);

      if (existing.length > 0) {
        await connection.query(`
          UPDATE deportes
          SET nombre = ?,
              tipo = ?,
              capacidad = ?,
              descripcion = ?,
              descripcion_larga = ?,
              icono = ?,
              imagen_url = ?,
              atletas_count = ?,
              entrenadores_count = ?,
              horario = ?,
              caracteristicas = ?,
              categorias = ?,
              especificaciones_tecnicas = ?,
              equipamiento = ?,
              normativas = ?,
              activo = TRUE
          WHERE id = ?
        `, [
          d.nombre,
          d.tipo || 'Deportes',
          d.capacidad || 0,
          d.descripcion,
          d.descripcion_larga,
          d.icono,
          d.imagen_url,
          d.atletas_count,
          d.entrenadores_count,
          d.horario,
          jsonFeatures,
          jsonCategories,
          jsonSpecs,
          jsonEquipment,
          jsonRegulations,
          d.id
        ]);
        console.log(`  ✔ [ID ${d.id}] ${d.nombre} actualizado.`);
      } else {
        await connection.query(`
          INSERT INTO deportes (
            id, nombre, tipo, capacidad, descripcion, descripcion_larga, icono,
            imagen_url, atletas_count, entrenadores_count, horario,
            caracteristicas, categorias, especificaciones_tecnicas,
            equipamiento, normativas, activo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `, [
          d.id,
          d.nombre,
          d.tipo || 'Deportes',
          d.capacidad || 0,
          d.descripcion,
          d.descripcion_larga,
          d.icono,
          d.imagen_url,
          d.atletas_count,
          d.entrenadores_count,
          d.horario,
          jsonFeatures,
          jsonCategories,
          jsonSpecs,
          jsonEquipment,
          jsonRegulations
        ]);
        console.log(`  ✔ [ID ${d.id}] ${d.nombre} insertado.`);
      }

      // 4. Sincronizar categorías en la tabla `categorias` si existe
      try {
        for (const catName of d.categorias) {
          const [catExists] = await connection.query(
            'SELECT id FROM categorias WHERE deporte_id = ? AND nombre = ?',
            [d.id, catName]
          );
          if (catExists.length === 0) {
            await connection.query(
              'INSERT INTO categorias (deporte_id, nombre) VALUES (?, ?)',
              [d.id, catName]
            );
          }
        }
      } catch (catErr) {
        // Ignorar si la tabla categorias no existe en la base
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ÉXITO: Las 8 disciplinas de Avellaneda FC han sido migradas y actualizadas correctamente con todas sus especificaciones y normativas.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA MIGRACIÓN DE DEPORTES:', error);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigration();
