/**
 * ============================================================
 * MIGRATE-INSTALACIONES.JS — Migración independiente para Instalaciones
 * ============================================================
 * Proyecto: Avellaneda FC
 *
 * Responsabilidades:
 *  1. Cargar la configuración de base de datos desde backend/.env
 *  2. Conectar a MySQL reutilizando el pool del backend (o creando conexión fallback)
 *  3. Verificar y asegurar la estructura completa de la tabla `instalaciones`
 *  4. Poblar / actualizar los espacios del club:
 *     - Cancha de Fútbol
 *     - Piscina Olímpica
 *     - Gimnasio
 *     - Canchas de Tenis (6 en total: 4 de polvo de ladrillo/clay y 2 sintéticas)
 *     - Polideportivo
 *  5. Notificar el éxito por consola
 *
 * Ejecución:
 *  node database/migrate-instalaciones.js
 * ============================================================
 */

const path = require('path');
// Asegurar resolución de dependencias desde backend/node_modules
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

const INSTALACIONES_DATA = [
  {
    id: 1,
    nombre: 'Cancha de Fútbol',
    icono: 'fa-futbol',
    tipo: 'Deportiva',
    descripcion: 'Cancha de césped natural de dimensiones reglamentarias con iluminación LED para partidos nocturnos.',
    descripcion_larga: 'La cancha de fútbol de Avellaneda FC es el corazón del club. Con dimensiones reglamentarias y césped natural de alta calidad, ha sido escenario de cientos de partidos memorables a lo largo de la historia del club. La instalación cuenta con iluminación LED de alto rendimiento que permite la realización de entrenamientos y competencias nocturnas con visibilidad óptima. La tribuna cubierta con capacidad para 500 espectadores ofrece una experiencia inigualable para quienes siguen a sus equipos en casa.',
    imagen_url: 'images/football_pitch.png',
    capacidad: 500,
    horario: 'Lunes a Viernes 9:00 - 22:00 / Sábados y Domingos 8:00 - 20:00',
    caracteristicas: [
      'Césped natural reglamentario',
      'Iluminación LED',
      'Tribuna cubierta',
      'Vestuarios próximos'
    ],
    especificaciones_tecnicas: [
      { key: 'Dimensiones', value: '105 × 68 metros' },
      { key: 'Superficie', value: 'Césped natural bermuda' },
      { key: 'Iluminación', value: '1500 lux (LED profesional)' },
      { key: 'Capacidad tribuna', value: '500 espectadores' },
      { key: 'Año de remodelación', value: '2023' },
      { key: 'Norma', value: 'FIFA Quality Pro' }
    ],
    normativas: [
      'Obligatorio el uso de botines o zapatillas deportivas adecuadas',
      'Prohibido el ingreso con botines de tapones de metal',
      'El acceso a la cancha requiere autorización del personal del club',
      'Prohibido fumar y consumir alcohol dentro del predio',
      'Los menores de 14 años deben estar acompañados por un adulto'
    ],
    equipamiento: [
      'Arcos reglamentarios con redes',
      'Banderines de córner',
      'Tablero marcador electrónico',
      'Sistema de riego automático',
      'Banco de suplentes cubierto',
      'Mesa de control y cronometraje'
    ]
  },
  {
    id: 2,
    nombre: 'Piscina Olímpica',
    icono: 'fa-water',
    tipo: 'Acuática',
    descripcion: 'Piscina olímpica de 50 metros con 8 carriles, temperatura regulada y sistema de filtrado de última generación.',
    descripcion_larga: 'La Piscina Olímpica de Avellaneda FC es una de las instalaciones acuáticas más completas de la región. Con sus 50 metros de longitud divididos en 8 carriles de competencia, ha sido sede de múltiples torneos provinciales de natación. El sistema de climatización mantiene el agua a temperatura constante de 26-28°C durante todo el año, permitiendo el uso pleno de las instalaciones independientemente de la estación. Una pileta auxiliar temperada de 25 metros complementa la oferta para la enseñanza de natación a niños y principiantes.',
    imagen_url: 'images/pool.png',
    capacidad: 300,
    horario: 'Lunes a Viernes 6:30 - 22:00 / Sábados 7:00 - 20:00 / Domingos 8:00 - 18:00',
    caracteristicas: [
      '50 metros / 8 carriles',
      'Temperatura regulada',
      'Tribuna de espectadores',
      'Trampolín y plataforma'
    ],
    especificaciones_tecnicas: [
      { key: 'Largo', value: '50 metros' },
      { key: 'Ancho', value: '25 metros (8 carriles)' },
      { key: 'Profundidad', value: '1.80m a 2.00m' },
      { key: 'Temperatura', value: '26-28 °C' },
      { key: 'Sistema de filtrado', value: 'Ultravioleta + cloración automática' },
      { key: 'Norma', value: 'FINA / World Aquatics' }
    ],
    normativas: [
      'Obligatorio el uso de gorro de natación en todo momento',
      'Obligatorio ducharse antes de ingresar al agua',
      'Prohibido correr en el área de la piscina',
      'Prohibido el ingreso con comida o bebidas al área acuática',
      'Los niños menores de 8 años deben estar acompañados por un adulto',
      'Respetar los carriles asignados según el nivel de natación'
    ],
    equipamiento: [
      'Bloques de salida de competencia',
      'Cronómetro electrónico con foto finish',
      'Corcheras de separación de carriles',
      'Trampolín de 1 metro y plataforma de 3 metros',
      'Tablas y pull-buoys para entrenamiento',
      'Sistema de megafonía para competencias'
    ]
  },
  {
    id: 3,
    nombre: 'Gimnasio',
    icono: 'fa-dumbbell',
    tipo: 'Fitness',
    descripcion: 'Más de 800m² con equipamiento de última generación. Zona de musculación, cardio y clases grupales.',
    descripcion_larga: 'El Gimnasio de Avellaneda FC es un espacio de entrenamiento de alta performance con más de 800 m² distribuidos en tres zonas especializadas. La sala de musculación cuenta con el equipamiento más moderno del mercado, importado de marcas líderes como Technogym y Life Fitness. La zona cardiovascular ofrece más de 30 máquinas de última generación con pantallas individuales integradas. El salón de clases grupales se usa para spinning, entrenamiento funcional, pilates, yoga y zumba, con capacidad para 25 personas simultáneas.',
    imagen_url: 'images/gym.png',
    capacidad: 80,
    horario: 'Lunes a Viernes 6:00 - 23:00 / Sábados 7:00 - 21:00 / Domingos 8:00 - 20:00',
    caracteristicas: [
      '800m² de superficie',
      'Equipos de última generación',
      'Zona cardio y musculación',
      'Clases grupales incluidas'
    ],
    especificaciones_tecnicas: [
      { key: 'Superficie total', value: '800 m²' },
      { key: 'Zona musculación', value: '400 m²' },
      { key: 'Zona cardiovascular', value: '200 m²' },
      { key: 'Salón clases grupales', value: '200 m²' },
      { key: 'Capacidad simultánea', value: '80 personas' },
      { key: 'Año de equipamiento', value: '2024' }
    ],
    normativas: [
      'Obligatorio el uso de ropa deportiva y zapatillas cerradas',
      'Obligatorio el uso de toalla personal en todas las máquinas',
      'Limpiar el equipo con el spray desinfectante provisto después de su uso',
      'Respetar los turnos de uso de las máquinas en horarios pico',
      'Prohibido el ingreso con bolsos grandes al área de entrenamiento',
      'Los menores de 16 años deben tener autorización médica y de sus padres'
    ],
    equipamiento: [
      'Máquinas de musculación Technogym (20 unidades)',
      'Barras olímpicas y plataformas de levantamiento',
      'Mancuernas de 2 a 60 kg',
      'Cintas de correr con pantalla táctil (10 unidades)',
      'Bicicletas estáticas y spinning (15 unidades)',
      'Elípticas y remos (8 unidades)',
      'Sistema de audio y climatización independiente'
    ]
  },
  {
    id: 4,
    nombre: 'Canchas de Tenis',
    icono: 'fa-circle',
    tipo: 'Deportiva',
    descripcion: 'Seis canchas profesionales (4 de polvo de ladrillo/clay y 2 de pasto sintético) con iluminación LED. Superficies variadas para adaptarse a todos los estilos de juego.',
    descripcion_larga: 'El complejo de tenis de Avellaneda FC cuenta con 6 canchas profesionales que cubren las principales superficies de juego: 4 canchas de polvo de ladrillo (clay) y 2 canchas de pasto sintético. Esta variedad permite que los jugadores desarrollen habilidades completas y se adapten a cualquier tipo de torneo. Las canchas están numeradas del 1 al 6 y todas cuentan con iluminación LED para partidos nocturnos. El pro shop del club ofrece encordado profesional, venta y alquiler de raquetas, y accesorios de la marca Wilson y Head.',
    imagen_url: 'images/tennis.png',
    capacidad: 40,
    horario: 'Lunes a Viernes 7:00 - 23:00 / Sábados 7:00 - 22:00 / Domingos 8:00 - 20:00',
    caracteristicas: [
      '6 canchas en total (4 clay + 2 sintético)',
      '4 canchas de polvo de ladrillo reglamentarias',
      '2 canchas de pasto sintético GreenSet',
      'Iluminación nocturna LED',
      'Alquiler de raquetas y servicio de encordado'
    ],
    especificaciones_tecnicas: [
      { key: 'Cantidad total de canchas', value: '6 canchas profesionales' },
      { key: 'Canchas de Polvo de Ladrillo (Clay)', value: '4 canchas certificadas' },
      { key: 'Canchas de Césped Sintético', value: '2 canchas GreenSet' },
      { key: 'Dimensiones', value: '23.77 × 10.97 metros (reglamentarias)' },
      { key: 'Iluminación', value: '500 lux (LED profesional)' },
      { key: 'Norma', value: 'ITF - International Tennis Federation' }
    ],
    normativas: [
      'Obligatorio el uso de zapatillas específicas para tenis (no running)',
      'En canchas de polvo de ladrillo, pasar el rastrillo y respetar el marcado de líneas',
      'Reservar la cancha con mínimo 24 horas de anticipación',
      'Máximo 2 horas de uso consecutivo por turno en horarios pico',
      'Las pelotas deben comprarse o alquilarse en el pro shop del club',
      'Prohibido el ingreso a las canchas con alimentos o bebidas con azúcar'
    ],
    equipamiento: [
      'Redes reglamentarias ajustables',
      'Máquina lanzapelotas automática (disponible para alquiler)',
      'Sillas de árbitro con parasol',
      'Tablero de puntuación manual y electrónico',
      'Stock de pelotas Wilson y Head para alquiler',
      'Raquetas de diferentes niveles para alquiler'
    ]
  },
  {
    id: 5,
    nombre: 'Polideportivo',
    icono: 'fa-building',
    tipo: 'Deportiva',
    descripcion: 'Cancha cubierta multiuso para básquet, vóley y eventos deportivos.',
    descripcion_larga: 'El Polideportivo Cubierto de Avellaneda FC es un recinto cerrado multipropósito con piso de parquet flotante de alta competencia. Con capacidad para más de 500 espectadores en sus graderías laterales, es la sede oficial de los partidos de la liga regional de básquet y vóley. Cuenta con tableros electrónicos, vestuarios exclusivos para equipos locales y visitantes, y sistema de sonido integral para competencias y actos institucionales.',
    imagen_url: 'images/football_pitch.png',
    capacidad: 500,
    horario: 'Lunes a Sábado 8:00 - 22:00 / Domingos según calendario de partidos',
    caracteristicas: [
      'Piso de parquet flotante',
      'Capacidad 500 espectadores',
      'Marcador electrónico',
      'Vestuarios independientes'
    ],
    especificaciones_tecnicas: [
      { key: 'Superficie total', value: '1200 m²' },
      { key: 'Tipo de piso', value: 'Parquet flotante amortiguado' },
      { key: 'Capacidad tribunas', value: '500 espectadores' },
      { key: 'Iluminación', value: '1200 lux LED' },
      { key: 'Norma', value: 'FIBA / FIVB' }
    ],
    normativas: [
      'Obligatorio el uso de calzado deportivo con suela de goma limpia (no manchar)',
      'Prohibido el ingreso con alimentos o bebidas excepto agua',
      'Respetar las zonas delimitadas para jugadores y espectadores',
      'El uso de las instalaciones debe ser coordinado con el departamento deportivo'
    ],
    equipamiento: [
      'Tableros de básquet hidráulicos reglamentarios',
      'Juego de postes y redes de vóley de alta tensión',
      'Marcador electrónico digital con consola central',
      'Bancos de suplentes y mesa de control',
      'Sistema de sonido y altoparlantes'
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
    console.log('🏟️  AVELLANEDA FC — Migración de Instalaciones del Club');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Conectado a la base de datos:', process.env.DB_NAME || 'avellaneda_fc');

    // 1. Asegurar tabla instalaciones
    await connection.query(`
      CREATE TABLE IF NOT EXISTS instalaciones (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(80) NOT NULL,
        descripcion TEXT,
        icono VARCHAR(50),
        imagen_url VARCHAR(255),
        capacidad SMALLINT UNSIGNED,
        tipo VARCHAR(40),
        activa BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);

    // 2. Verificar y agregar columnas extendidas
    await addColumnIfMissing(connection, 'instalaciones', 'descripcion_larga', 'LONGTEXT NULL');
    await addColumnIfMissing(connection, 'instalaciones', 'horario', 'VARCHAR(200) NULL');
    await addColumnIfMissing(connection, 'instalaciones', 'caracteristicas', 'JSON NULL');
    await addColumnIfMissing(connection, 'instalaciones', 'especificaciones_tecnicas', 'JSON NULL');
    await addColumnIfMissing(connection, 'instalaciones', 'normativas', 'JSON NULL');
    await addColumnIfMissing(connection, 'instalaciones', 'equipamiento', 'JSON NULL');

    // 3. Poblar / Actualizar cada espacio del club
    console.log('\n📦 Actualizando espacios e instalaciones...');
    for (const inst of INSTALACIONES_DATA) {
      const jsonFeatures = JSON.stringify(inst.caracteristicas);
      const jsonSpecs = JSON.stringify(inst.especificaciones_tecnicas);
      const jsonRegulations = JSON.stringify(inst.normativas);
      const jsonEquipment = JSON.stringify(inst.equipamiento);

      const [existing] = await connection.query('SELECT id FROM instalaciones WHERE id = ?', [inst.id]);

      if (existing.length > 0) {
        await connection.query(`
          UPDATE instalaciones
          SET nombre = ?,
              icono = ?,
              tipo = ?,
              descripcion = ?,
              descripcion_larga = ?,
              imagen_url = ?,
              capacidad = ?,
              horario = ?,
              caracteristicas = ?,
              especificaciones_tecnicas = ?,
              normativas = ?,
              equipamiento = ?,
              activa = TRUE
          WHERE id = ?
        `, [
          inst.nombre,
          inst.icono,
          inst.tipo,
          inst.descripcion,
          inst.descripcion_larga,
          inst.imagen_url,
          inst.capacidad,
          inst.horario,
          jsonFeatures,
          jsonSpecs,
          jsonRegulations,
          jsonEquipment,
          inst.id
        ]);
        console.log(`  ✔ [ID ${inst.id}] ${inst.nombre} actualizado.`);
      } else {
        await connection.query(`
          INSERT INTO instalaciones (
            id, nombre, icono, tipo, descripcion, descripcion_larga,
            imagen_url, capacidad, horario, caracteristicas,
            especificaciones_tecnicas, normativas, equipamiento, activa
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `, [
          inst.id,
          inst.nombre,
          inst.icono,
          inst.tipo,
          inst.descripcion,
          inst.descripcion_larga,
          inst.imagen_url,
          inst.capacidad,
          inst.horario,
          jsonFeatures,
          jsonSpecs,
          jsonRegulations,
          jsonEquipment
        ]);
        console.log(`  ✔ [ID ${inst.id}] ${inst.nombre} insertado.`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ÉXITO: Las instalaciones de Avellaneda FC han sido migradas y actualizadas correctamente.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('\n❌ ERROR durante la migración de instalaciones:', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
