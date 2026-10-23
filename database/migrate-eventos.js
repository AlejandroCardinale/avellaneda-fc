/**
 * ============================================================
 * MIGRATE-EVENTOS.JS — Migración independiente para Eventos
 * ============================================================
 * Proyecto: Avellaneda FC
 *
 * Responsabilidades:
 *  1. Cargar la configuración de base de datos desde backend/.env
 *  2. Conectar a MySQL utilizando el pool de conexiones
 *  3. Verificar y asegurar la estructura completa de la tabla `eventos`
 *     (id, titulo, descripcion, descripcion_larga, fecha_hora, hora_fin,
 *      lugar, lugar_detalle, disciplina, categoria, imagen_url,
 *      cronograma, categorias_participantes, inscripcion_abierta,
 *      inscripcion_limite, inscripcion_contacto, reglas, premios,
 *      publicado, creado_por, creado_en)
 *  4. Poblar / actualizar la agenda completa de eventos (mínimo 2 por semana
 *     desde finales de octubre 2026 hasta marzo 2027, incluyendo las peñas
 *     folklóricas mensuales los días sábado).
 *  5. Garantizar que NO se incluya ningún costo ni precio monetario.
 *  6. Notificar el éxito por consola.
 *
 * Ejecución:
 *  node database/migrate-eventos.js
 * ============================================================
 */

const path = require('path');
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

const EVENTOS_DATA = [
  // ── OCTUBRE 2026 ─────────────────────────────────────────────────────────────
  {
    id: 1,
    titulo: 'Gran Peña Folklórica de Primavera',
    descripcion: 'Noche de música folklórica en vivo, danzas tradicionales y encuentro familiar.',
    descripcion_larga: 'Celebramos la llegada de la primavera con la tradicional peña folklórica de Avellaneda FC. Una noche especial para reunir a la familia del club con espectáculos en vivo de conjuntos folklóricos zonales, ballets invitados y servicio de buffet atendido por las subcomisiones del club.',
    fecha_hora: '2026-10-24 21:30:00',
    hora_fin: '02:00 hs',
    lugar: 'Quincho Principal',
    lugar_detalle: 'Sector parrillas y carpa climatizada. Acceso libre por portón central.',
    disciplina: 'Social',
    categoria: 'Sociales',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '21:30', activity: 'Apertura de puertas y recepción de familias' },
      { time: '22:30', activity: 'Presentación del Ballet Folklórico de Avellaneda' },
      { time: '23:45', activity: 'Show en vivo: Conjunto Los Caminantes del Sur' },
      { time: '01:00', activity: 'Guitarreada abierta comunitaria y cierre' }
    ],
    categorias_participantes: ['Abierto a toda la comunidad', 'Socios y familias'],
    inscripcion_abierta: true,
    inscripcion_limite: 'Mismo día del evento',
    inscripcion_contacto: 'eventos@avellanedafc.com',
    reglas: [
      'Ambiente estrictamente familiar y de sana convivencia',
      'Prohibido el ingreso con pirotecnia o elementos punzantes',
      'Cuidar los espacios verdes y las instalaciones del predio'
    ],
    premios: ['Menciones especiales a los artistas invitados', 'Sorteo de indumentaria oficial'],
    publicado: true
  },
  {
    id: 2,
    titulo: 'Torneo de Natación - Copa Primavera',
    descripcion: 'Competencia en piscina olímpica para escuelas formativas y equipos federados.',
    descripcion_larga: 'Llega la Copa Primavera de Natación en nuestra piscina olímpica de 50 metros. Participarán más de 120 nadadores de clubes amigos de la provincia en pruebas de 50m y 100m libres, espalda, pecho y mariposa, cerrando con postas 4x50m.',
    fecha_hora: '2026-10-28 09:00:00',
    hora_fin: '13:30 hs',
    lugar: 'Piscina Olímpica',
    lugar_detalle: 'Complejo acuático cubierto. Acceso por vestuarios generales.',
    disciplina: 'Natación',
    categoria: 'Torneos',
    imagen_url: 'images/pool.png',
    cronograma: [
      { time: '08:30', activity: 'Acreditación y ablande en el agua' },
      { time: '09:15', activity: 'Pruebas individuales de 50m y 100m' },
      { time: '11:45', activity: 'Series de relevos 4x50m mixtos' },
      { time: '12:45', activity: 'Ceremonia de premiación y entrega de medallas' }
    ],
    categorias_participantes: ['Infantiles (9-12 años)', 'Juveniles (13-17 años)', 'Mayores'],
    inscripcion_abierta: true,
    inscripcion_limite: '26 Oct 2026',
    inscripcion_contacto: 'natacion@avellanedafc.com',
    reglas: [
      'Uso obligatorio de gorro de natación y antiparras',
      'Apto médico acuático vigente registrado en secretaría',
      'Puntualidad en la zona de pre-llamada de cada serie'
    ],
    premios: ['Medallas doradas, plateadas y de bronce', 'Diplomas de participación'],
    publicado: true
  },
  {
    id: 3,
    titulo: 'Clínica Abierta de Tenis de Dobles',
    descripcion: 'Jornada intensiva de técnica, posicionamiento y táctica de dobles.',
    descripcion_larga: 'Dirigida a socios y socias que deseen perfeccionar su juego en pareja. Se trabajarán desplazamientos sincronizados, voleas cruzadas, cobertura de red y estrategias de saque y devolución en polvo de ladrillo.',
    fecha_hora: '2026-10-31 15:00:00',
    hora_fin: '18:30 hs',
    lugar: 'Canchas de Tenis',
    lugar_detalle: 'Canchas 1 a 4 de polvo de ladrillo.',
    disciplina: 'Tenis',
    categoria: 'Deportivos',
    imagen_url: 'images/tennis.png',
    cronograma: [
      { time: '15:00', activity: 'Entrada en calor y movilidad específica' },
      { time: '15:30', activity: 'Ejercicios de volea y control de red' },
      { time: '16:45', activity: 'Partidos de práctica guiados con corrección en vivo' },
      { time: '18:00', activity: 'Charla técnica de cierre y elongación' }
    ],
    categorias_participantes: ['Nivel Inicial', 'Nivel Intermedio', 'Nivel Avanzado'],
    inscripcion_abierta: true,
    inscripcion_limite: '30 Oct 2026',
    inscripcion_contacto: 'tenis@avellanedafc.com',
    reglas: [
      'Calzado exclusivo para polvo de ladrillo (suela espiga)',
      'Traer raqueta propia (el club provee pelotas de práctica)',
      'Respetar las indicaciones de los profesores en cancha'
    ],
    premios: ['Sorteos de tubos de pelotas y accesorios deportivos'],
    publicado: true
  },

  // ── NOVIEMBRE 2026 ───────────────────────────────────────────────────────────
  {
    id: 4,
    titulo: 'Jornada de Entrenamiento Abierto de Básquet',
    descripcion: 'Entrenamiento a puertas abiertas del plantel superior con análisis táctico.',
    descripcion_larga: 'Una oportunidad para que los jóvenes de las divisiones formativas y los hinchas del club conozcan de cerca el trabajo del plantel de Primera División de Básquetbol. Habrá interacción con el cuerpo técnico y sesión de lanzamientos.',
    fecha_hora: '2026-11-04 19:00:00',
    hora_fin: '21:30 hs',
    lugar: 'Polideportivo Cubierto',
    lugar_detalle: 'Estadio principal, ingreso por Av. Mitre.',
    disciplina: 'Básquet',
    categoria: 'Deportivos',
    imagen_url: 'images/gym.png',
    cronograma: [
      { time: '19:00', activity: 'Acondicionamiento físico y velocidad' },
      { time: '19:45', activity: 'Sistemas tácticos ofensivos y defensivos' },
      { time: '20:45', activity: 'Juegos de tiro con los chicos de la escuelita' }
    ],
    categorias_participantes: ['Socios del club', 'Divisiones formativas'],
    inscripcion_abierta: false,
    inscripcion_limite: 'Acceso libre para socios',
    inscripcion_contacto: 'basquet@avellanedafc.com',
    reglas: ['Mantener silencio durante las indicaciones del entrenador', 'Uso de calzado adecuado para no marcar el parquet'],
    premios: ['Fotos oficiales y firma de autógrafos con los jugadores'],
    publicado: true
  },
  {
    id: 5,
    titulo: 'Amistoso de Fútbol Femenino vs Club Atlético Mitre',
    descripcion: 'Encuentro preparatorio de la Primera División Femenina rumbo al torneo oficial.',
    descripcion_larga: 'Nuestro primer equipo femenino se medirá ante el Club Atlético Mitre en un duelo que promete grandes emociones. Con entrada libre y gratuita para todos los socios y simpatizantes del club.',
    fecha_hora: '2026-11-07 16:30:00',
    hora_fin: '19:00 hs',
    lugar: 'Canchas de Fútbol - Sede Principal',
    lugar_detalle: 'Cancha principal de césped natural con tribuna habilitada.',
    disciplina: 'Fútbol',
    categoria: 'Deportivos',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '16:00', activity: 'Calentamiento precompetitivo de ambos planteles' },
      { time: '16:30', activity: 'Inicio del primer tiempo (45 minutos)' },
      { time: '17:30', activity: 'Segundo tiempo y definición deportiva' }
    ],
    categorias_participantes: ['Primera División Femenina'],
    inscripcion_abierta: false,
    inscripcion_limite: 'Entrada libre',
    inscripcion_contacto: 'futbol.fem@avellanedafc.com',
    reglas: ['Aliento deportivo sin cánticos ofensivos', 'Prohibido ingresar con bebidas alcohólicas'],
    premios: ['Copa Amistad Deportiva Avellaneda'],
    publicado: true
  },
  {
    id: 6,
    titulo: 'Jornada Solidaria: Colecta Comunitaria',
    descripcion: 'Campaña de recepción de alimentos y útiles para comedores de la zona.',
    descripcion_larga: 'Avellaneda FC reafirma su compromiso social convocando a socios, deportistas y vecinos a colaborar con alimentos no perecederos, ropa deportiva y útiles escolares para merenderos de la comunidad.',
    fecha_hora: '2026-11-11 10:00:00',
    hora_fin: '18:00 hs',
    lugar: 'Acceso Principal',
    lugar_detalle: 'Hall central de recepción en Av. Mitre 1200.',
    disciplina: 'Social',
    categoria: 'Institucionales',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '10:00', activity: 'Apertura de la mesa de recepción de donaciones' },
      { time: '15:00', activity: 'Clasificación y empaquetado con voluntarios' },
      { time: '17:30', activity: 'Sorteo de indumentaria entre los donantes' }
    ],
    categorias_participantes: ['Comunidad general', 'Socios y deportistas'],
    inscripcion_abierta: true,
    inscripcion_limite: 'Durante toda la jornada',
    inscripcion_contacto: 'solidaridad@avellanedafc.com',
    reglas: ['Los alimentos deben tener fecha de vencimiento vigente', 'Ropa limpia y en buen estado de conservación'],
    premios: ['Sorteo de camisetas y balones autografiados'],
    publicado: true
  },
  {
    id: 7,
    titulo: 'Encuentro Regional de Mini-Vóley',
    descripcion: 'Jornada recreativa con más de 150 chicos de categorías formativas.',
    descripcion_larga: 'Gran jornada deportiva dedicada al vóley formativo. Recibiremos delegaciones de 8 clubes de la región en un formato integrador donde lo prioritario es aprender, jugar y compartir.',
    fecha_hora: '2026-11-14 10:00:00',
    hora_fin: '15:30 hs',
    lugar: 'Polideportivo Cubierto',
    lugar_detalle: 'Canchas simultáneas 1, 2 y 3 del polideportivo.',
    disciplina: 'Vóley',
    categoria: 'Deportivos',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '09:30', activity: 'Llegada y bienvenida a las delegaciones' },
      { time: '10:15', activity: 'Rotación de partidos reducidos (2vs2 y 3vs3)' },
      { time: '13:00', activity: 'Almuerzo compartido al aire libre' },
      { time: '14:30', activity: 'Entrega de reconocimientos a todos los chicos' }
    ],
    categorias_participantes: ['Bajitos (6-8 años)', 'Pre-Mini (9-10 años)', 'Mini (11-12 años)'],
    inscripcion_abierta: true,
    inscripcion_limite: '11 Nov 2026',
    inscripcion_contacto: 'voley@avellanedafc.com',
    reglas: ['Juego limpio y respeto a los árbitros', 'No se computan tablas de posiciones eliminatorias'],
    premios: ['Medalla conmemorativa para cada participante'],
    publicado: true
  },
  {
    id: 8,
    titulo: 'Torneo Relámpago de Truco Inter-Socios',
    descripcion: 'Tradicional torneo en parejas para socios en la confitería del club.',
    descripcion_larga: 'Demostrá tu habilidad y picardía en el juego de naipes más querido de nuestra cultura. Torneo en parejas por eliminación directa con rondas de 30 puntos en un ambiente ameno.',
    fecha_hora: '2026-11-18 19:30:00',
    hora_fin: '00:00 hs',
    lugar: 'Confitería del Club',
    lugar_detalle: 'Salón de planta baja de la sede social.',
    disciplina: 'Recreación',
    categoria: 'Sociales',
    imagen_url: 'images/pool.png',
    cronograma: [
      { time: '19:30', activity: 'Sorteo oficial de parejas y llaves' },
      { time: '20:00', activity: 'Inicio de la fase de octavos de final' },
      { time: '22:30', activity: 'Semifinales y gran final' }
    ],
    categorias_participantes: ['Parejas de socios mayores de 16 años'],
    inscripcion_abierta: true,
    inscripcion_limite: '17 Nov 2026',
    inscripcion_contacto: 'buffet@avellanedafc.com',
    reglas: ['Señas reglamentarias tradicionales de la Asociación Argentina de Truco', 'Conducta deportiva obligatoria'],
    premios: ['Cena de camaradería en la confitería', 'Trofeo para los campeones'],
    publicado: true
  },
  {
    id: 9,
    titulo: 'Peña Folklórica y Día de la Tradición',
    descripcion: 'Celebración de nuestras raíces con payadores, bombos y zambas.',
    descripcion_larga: 'En el marco del mes de la tradición argentina, Avellaneda FC abre sus puertas para una noche de peña gaucha. Guitarras, bombos legüeros, grupos de danzas y la calidez de siempre para todos los socios y vecinos.',
    fecha_hora: '2026-11-21 21:00:00',
    hora_fin: '02:30 hs',
    lugar: 'Quincho Principal',
    lugar_detalle: 'Predio de quinchos y parrillas.',
    disciplina: 'Social',
    categoria: 'Sociales',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '21:00', activity: 'Apertura con música ambiente criolla' },
      { time: '22:00', activity: 'Ballet Tradicionalista Pampa Nativa' },
      { time: '23:30', activity: 'Presentación estelar: Dúo Los Cardales' },
      { time: '01:00', activity: 'Pista de baile y peña abierta' }
    ],
    categorias_participantes: ['Abierto a socios e invitados'],
    inscripcion_abierta: true,
    inscripcion_limite: 'Mismo día',
    inscripcion_contacto: 'eventos@avellanedafc.com',
    reglas: ['Respetar las mesas asignadas', 'Prohibido el uso de pirotecnia'],
    premios: ['Sorteo de canastas de productos regionales'],
    publicado: true
  },
  {
    id: 10,
    titulo: 'Reunión Abierta de Socios e Informe de Obras',
    descripcion: 'Exposición de la Comisión Directiva sobre el plan de infraestructura.',
    descripcion_larga: 'Se convoca a las socias y socios de todas las categorías a la reunión informativa semestral, donde se presentarán los avances en las remodelaciones de vestuarios, iluminación de canchas y estado financiero del club.',
    fecha_hora: '2026-11-25 19:30:00',
    hora_fin: '21:30 hs',
    lugar: 'Salón de Actos',
    lugar_detalle: 'Primer piso de la Sede Social.',
    disciplina: 'Institucional',
    categoria: 'Institucionales',
    imagen_url: 'images/pool.png',
    cronograma: [
      { time: '19:30', activity: 'Acreditación con carnet de socio' },
      { time: '19:45', activity: 'Informe del Presidente y Tesorero' },
      { time: '20:30', activity: 'Espacio de preguntas y propuestas de los socios' }
    ],
    categorias_participantes: ['Socios activos con cuota al día'],
    inscripcion_abierta: false,
    inscripcion_limite: 'Ingreso directo con carnet',
    inscripcion_contacto: 'secretaria@avellanedafc.com',
    reglas: ['Presentar carnet físico o digital', 'Participación en el marco del respeto institucional'],
    premios: [],
    publicado: true
  },
  {
    id: 11,
    titulo: 'Cena Anual y Premiación de Deportistas',
    descripcion: 'La gran fiesta anual del club con entrega de distinciones al mérito deportivo.',
    descripcion_larga: 'El evento social más importante del año en Avellaneda FC. Homenajearemos a los atletas destacados de cada disciplina, entrenadores y socios vitalicios en una velada inolvidable.',
    fecha_hora: '2026-11-28 21:00:00',
    hora_fin: '03:00 hs',
    lugar: 'Salón de Eventos',
    lugar_detalle: 'Salón principal de fiestas y eventos.',
    disciplina: 'Social',
    categoria: 'Sociales',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '21:00', activity: 'Recepción y cóctel de bienvenida' },
      { time: '22:15', activity: 'Cena de gala y video institucional' },
      { time: '23:30', activity: 'Entrega de los Premios Deportista del Año' },
      { time: '01:00', activity: 'Brindis de honor y música en vivo' }
    ],
    categorias_participantes: ['Socios, deportistas, cuerpo técnico y directivos'],
    inscripcion_abierta: true,
    inscripcion_limite: '20 Nov 2026',
    inscripcion_contacto: 'eventos@avellanedafc.com',
    reglas: ['Vestimenta elegante / formal', 'Reserva previa de lugares en secretaría'],
    premios: ['Trofeos al Mejor Deportista por Disciplina', 'Estatuilla de Oro Avellaneda FC'],
    publicado: true
  },

  // ── DICIEMBRE 2026 ───────────────────────────────────────────────────────────
  {
    id: 12,
    titulo: 'Masterclass de Funcional y Spinning al Aire Libre',
    descripcion: 'Entrenamiento de resistencia cardiovascular con música y profesores del gimnasio.',
    descripcion_larga: 'Aprovechando el atardecer, trasladamos 25 bicicletas de spinning y estaciones de entrenamiento funcional al playón central para una clase colectiva de alta intensidad y diversión.',
    fecha_hora: '2026-12-02 18:30:00',
    hora_fin: '20:30 hs',
    lugar: 'Playón Deportivo',
    lugar_detalle: 'Área deportiva al aire libre.',
    disciplina: 'Fitness',
    categoria: 'Deportivos',
    imagen_url: 'images/gym.png',
    cronograma: [
      { time: '18:30', activity: 'Ajuste de bicicletas y entrada en calor' },
      { time: '19:00', activity: 'Bloque de intervalos de alta intensidad (HIIT)' },
      { time: '20:00', activity: 'Vuelta a la calma, respiración y stretching' }
    ],
    categorias_participantes: ['Socios de 16 años en adelante'],
    inscripcion_abierta: true,
    inscripcion_limite: '01 Dic 2026',
    inscripcion_contacto: 'gimnasio@avellanedafc.com',
    reglas: ['Uso obligatorio de toalla personal y botella de hidratación', 'Apto médico al día'],
    premios: ['Sorteos de suplementación e hidratación deportiva'],
    publicado: true
  },
  {
    id: 13,
    titulo: 'Torneo de Verano de Básquet 3x3',
    descripcion: 'Competencia en media cancha con ritmo dinámico y música en vivo.',
    descripcion_larga: 'Formato FIBA 3x3 en el polideportivo cubierto. Equipos de 4 integrantes (3 en cancha y 1 relevo) disputando partidos intensos a 10 minutos o 21 puntos.',
    fecha_hora: '2026-12-05 14:00:00',
    hora_fin: '19:30 hs',
    lugar: 'Polideportivo Cubierto',
    lugar_detalle: 'Cancha central con tableros de acrílico reglamentarios.',
    disciplina: 'Básquet',
    categoria: 'Torneos',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '13:30', activity: 'Acreditación de equipos y sorteo de grupos' },
      { time: '14:15', activity: 'Fase de zonas clasificatorias' },
      { time: '17:30', activity: 'Concurso de triples' },
      { time: '18:15', activity: 'Final y coronación de campeones' }
    ],
    categorias_participantes: ['Sub-18 Masculino', 'Libre Masculino', 'Libre Femenino'],
    inscripcion_abierta: true,
    inscripcion_limite: '03 Dic 2026',
    inscripcion_contacto: 'basquet@avellanedafc.com',
    reglas: ['Reglamento oficial FIBA 3x3', 'Uso de calzado de básquetbol limpio'],
    premios: ['Trofeos para el 1° y 2° puesto', 'Medallas y camisetas del torneo'],
    publicado: true
  },
  {
    id: 14,
    titulo: 'Festival de Cierre de Escuelas Infantiles',
    descripcion: 'Muestra deportiva de fin de año con los más pequeños del club.',
    descripcion_larga: 'Los chicos y chicas de Baby Fútbol, Mini Tenis, Escuelita de Vóley y Judo infantil demuestran lo aprendido durante el año junto a sus familias en una jornada de sonrisas y aplausos.',
    fecha_hora: '2026-12-09 17:00:00',
    hora_fin: '20:30 hs',
    lugar: 'Canchas de Fútbol - Sede Principal',
    lugar_detalle: 'Cancha auxiliar sintética y sector de juegos.',
    disciplina: 'Fútbol',
    categoria: 'Sociales',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '17:00', activity: 'Desfile de apertura con todas las escuelitas' },
      { time: '17:30', activity: 'Circuitos de juegos rotativos por disciplina' },
      { time: '19:30', activity: 'Entrega de medallas de reconocimiento a cada niño' }
    ],
    categorias_participantes: ['Alumnos de escuelitas deportivas (4 a 12 años)'],
    inscripcion_abierta: false,
    inscripcion_limite: 'Participación abierta a todos los inscriptos anuales',
    inscripcion_contacto: 'deportes@avellanedafc.com',
    reglas: ['Fomentar el compañerismo y el juego en equipo'],
    premios: ['Medalla al mérito deportivo para todos los alumnos'],
    publicado: true
  },
  {
    id: 15,
    titulo: 'Torneo Clausura de Tenis Singles',
    descripcion: 'El torneo definitorio del ranking anual de tenis del club.',
    descripcion_larga: 'Último torneo del año en las canchas de polvo de ladrillo de Avellaneda FC. Partidos al mejor de 3 sets que consagrarán a los campeones de las distintas categorías del club.',
    fecha_hora: '2026-12-12 09:00:00',
    hora_fin: '19:00 hs',
    lugar: 'Canchas de Tenis',
    lugar_detalle: 'Complejo de canchas 1 a 6.',
    disciplina: 'Tenis',
    categoria: 'Torneos',
    imagen_url: 'images/tennis.png',
    cronograma: [
      { time: '09:00', activity: 'Primera ronda eliminatoria' },
      { time: '13:00', activity: 'Cuartos de final' },
      { time: '16:00', activity: 'Semifinales' },
      { time: '17:45', activity: 'Gran Final y entrega de copas' }
    ],
    categorias_participantes: ['Primera Caballeros', 'Segunda Caballeros', 'Damas Única'],
    inscripcion_abierta: true,
    inscripcion_limite: '09 Dic 2026',
    inscripcion_contacto: 'tenis@avellanedafc.com',
    reglas: ['Reglamento AAT', 'Tiempo de descanso reglamentario de 10 minutos entre sets'],
    premios: ['Copas de campeón y subcampeón', 'Sumatoria para el ranking del club'],
    publicado: true
  },
  {
    id: 16,
    titulo: 'Gala de Natación y Muestra de Estilos',
    descripcion: 'Muestra acuática sincronizada y carreras exhibición en la pileta olímpica.',
    descripcion_larga: 'Una tarde acuática deslumbrante donde nuestros nadadores federados y de escuela demostrarán técnicas en los cuatro estilos olímpicos, con música y coreografías acuáticas.',
    fecha_hora: '2026-12-16 18:00:00',
    hora_fin: '21:00 hs',
    lugar: 'Piscina Olímpica',
    lugar_detalle: 'Tribuna de espectadores habilitada.',
    disciplina: 'Natación',
    categoria: 'Deportivos',
    imagen_url: 'images/pool.png',
    cronograma: [
      { time: '18:00', activity: 'Apertura con desfile de banderas acuáticas' },
      { time: '18:30', activity: 'Demostración técnica de 100m mariposa y espalda' },
      { time: '19:45', activity: 'Relevo gigante familiar de 8 carriles' }
    ],
    categorias_participantes: ['Todas las edades de natación formativa'],
    inscripcion_abierta: true,
    inscripcion_limite: '14 Dic 2026',
    inscripcion_contacto: 'natacion@avellanedafc.com',
    reglas: ['Permanecer en las tribunas para espectadores'],
    premios: ['Menciones de honor a los mejores progresos anuales'],
    publicado: true
  },
  {
    id: 17,
    titulo: 'Gran Peña Folklórica de Fin de Año',
    descripcion: 'Despedimos el 2026 con un gran festejo tradicionalista.',
    descripcion_larga: 'Nuestra última peña del año reúne a cientos de vecinos y socios con una gran carpa folklórica, grupos de baile locales, música norteña y chamamé en vivo.',
    fecha_hora: '2026-12-19 21:00:00',
    hora_fin: '03:00 hs',
    lugar: 'Quincho Principal',
    lugar_detalle: 'Predio de quinchos y patio cervecero.',
    disciplina: 'Social',
    categoria: 'Sociales',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '21:00', activity: 'Bienvenida y arranque de música en vivo' },
      { time: '22:30', activity: 'Ballet Folklórico del Club' },
      { time: '00:00', activity: 'Brindis de anticipo de fin de año' },
      { time: '00:30', activity: 'Gran recital folklórico bailable' }
    ],
    categorias_participantes: ['Público en general'],
    inscripcion_abierta: true,
    inscripcion_limite: 'Mismo día',
    inscripcion_contacto: 'eventos@avellanedafc.com',
    reglas: ['Ambiente familiar y cuidado del patrimonio del club'],
    premios: ['Sorteos de canastas navideñas'],
    publicado: true
  },
  {
    id: 18,
    titulo: 'Jornada Navideña Solidaria y Sorteos',
    descripcion: 'Papá Noel visita el club para sacarse fotos y entregar golosinas.',
    descripcion_larga: 'Para que los más chiquitos vivan la magia de la Navidad en su club. Habrá inflables, juegos recreativos, carta a Papá Noel y una jornada de entrega de juguetes.',
    fecha_hora: '2026-12-23 16:00:00',
    hora_fin: '19:30 hs',
    lugar: 'Salón de Eventos',
    lugar_detalle: 'Salón principal con decoración temática.',
    disciplina: 'Social',
    categoria: 'Institucionales',
    imagen_url: 'images/pool.png',
    cronograma: [
      { time: '16:00', activity: 'Apertura de estaciones de juegos e inflables' },
      { time: '17:30', activity: 'Llegada de Papá Noel y entrega de cartas' },
      { time: '18:45', activity: 'Sorteo navideño de bicicletas y pelotas' }
    ],
    categorias_participantes: ['Niñas y niños de hasta 12 años'],
    inscripcion_abierta: false,
    inscripcion_limite: 'Acceso libre y gratuito',
    inscripcion_contacto: 'eventos@avellanedafc.com',
    reglas: ['Los menores deben ingresar acompañados por un adulto responsable'],
    premios: ['Juguetes y golosinas para todos los niños'],
    publicado: true
  },
  {
    id: 19,
    titulo: 'Torneo Relámpago de Fútbol 7 - Copa Fin de Año',
    descripcion: 'Torneo en césped sintético para despedir la temporada con amigos.',
    descripcion_larga: 'Competencia rápida de fin de año para socios. Equipos de fútbol 7 en partidos de dos tiempos de 15 minutos con eliminación directa.',
    fecha_hora: '2026-12-26 15:00:00',
    hora_fin: '20:00 hs',
    lugar: 'Canchas de Fútbol - Sede Principal',
    lugar_detalle: 'Canchas de césped sintético 1 y 2.',
    disciplina: 'Fútbol',
    categoria: 'Torneos',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '15:00', activity: 'Octavos de final' },
      { time: '17:00', activity: 'Cuartos de final y semifinales' },
      { time: '19:00', activity: 'Final y entrega de la Copa Fin de Año' }
    ],
    categorias_participantes: ['Socios Mayores de 18 años'],
    inscripcion_abierta: true,
    inscripcion_limite: '23 Dic 2026',
    inscripcion_contacto: 'futbol@avellanedafc.com',
    reglas: ['Reglamento oficial de Fútbol 7', 'Canilleras obligatorias'],
    premios: ['Copa Fin de Año y juego de camisetas para el campeón'],
    publicado: true
  },
  {
    id: 20,
    titulo: 'Brindis de Cierre de Año para Socios y Familias',
    descripcion: 'Despedida informal de año en la terraza de la confitería.',
    descripcion_larga: 'Nos reunimos a brindar por un 2026 lleno de logros deportivos e institucionales, y proyectar un 2027 que nos encuentre más unidos que nunca.',
    fecha_hora: '2026-12-30 20:00:00',
    hora_fin: '23:00 hs',
    lugar: 'Confitería del Club',
    lugar_detalle: 'Terraza y salón principal de la confitería.',
    disciplina: 'Social',
    categoria: 'Sociales',
    imagen_url: 'images/pool.png',
    cronograma: [
      { time: '20:00', activity: 'Recepción con música acústica' },
      { time: '21:00', activity: 'Palabras del Presidente del Club' },
      { time: '21:30', activity: 'Brindis institucional de honor' }
    ],
    categorias_participantes: ['Todos los socios del club'],
    inscripcion_abierta: false,
    inscripcion_limite: 'Entrada libre',
    inscripcion_contacto: 'secretaria@avellanedafc.com',
    reglas: ['Presentar carnet de socio'],
    premios: [],
    publicado: true
  },

  // ── ENERO 2027 ───────────────────────────────────────────────────────────────
  {
    id: 21,
    titulo: 'Apertura de Temporada de Verano en Piscina',
    descripcion: 'Inauguración oficial de la temporada de colonia y pileta libre 2027.',
    descripcion_larga: 'Avellaneda FC da inicio a las actividades de pileta libre y colonia de vacaciones 2027 con juegos acuáticos, música de verano y actividades recreativas para toda la familia.',
    fecha_hora: '2027-01-02 11:00:00',
    hora_fin: '19:00 hs',
    lugar: 'Piscina Olímpica',
    lugar_detalle: 'Sector solárium y pileta recreativa.',
    disciplina: 'Natación',
    categoria: 'Sociales',
    imagen_url: 'images/pool.png',
    cronograma: [
      { time: '11:00', activity: 'Apertura del solárium' },
      { time: '14:00', activity: 'Aqua-gym libre y gratuito con profesores del club' },
      { time: '16:30', activity: 'Juegos acuáticos para niños' }
    ],
    categorias_participantes: ['Socios con carnet de pileta'],
    inscripcion_abierta: false,
    inscripcion_limite: 'Acceso por molinete con abono verano',
    inscripcion_contacto: 'natacion@avellanedafc.com',
    reglas: ['Revisión médica y odontológica al día', 'Ducha previa antes de ingresar'],
    premios: [],
    publicado: true
  },
  {
    id: 22,
    titulo: 'Jornada de Reyes para Niños y Familias',
    descripcion: 'Llegada de los Reyes Magos con sorpresas y juegos para los más chicos.',
    descripcion_larga: 'Celebramos la Noche de Reyes en el club con animación infantil, búsqueda del tesoro y entrega de regalos simbólicos para los hijos de socios.',
    fecha_hora: '2027-01-06 17:30:00',
    hora_fin: '20:30 hs',
    lugar: 'Quincho y Parque Infantil',
    lugar_detalle: 'Parque infantil al aire libre.',
    disciplina: 'Recreación',
    categoria: 'Sociales',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '17:30', activity: 'Juegos con animadores' },
      { time: '18:45', activity: 'Llegada de los Reyes Magos y entrega de regalos' }
    ],
    categorias_participantes: ['Niños de 3 a 10 años'],
    inscripcion_abierta: false,
    inscripcion_limite: 'Acceso libre',
    inscripcion_contacto: 'eventos@avellanedafc.com',
    reglas: ['Cuidado de los juegos inflables'],
    premios: ['Juguetes y regalitos para todos los presentes'],
    publicado: true
  },
  {
    id: 23,
    titulo: 'Torneo Nocturno de Tenis Dobles',
    descripcion: 'Torneo de dobles bajo las luces LED de nuestras canchas.',
    descripcion_larga: 'Aprovechando las frescas noches de verano, organizamos un torneo de dobles nocturno para socios con cuadros masculino, femenino y mixto.',
    fecha_hora: '2027-01-09 19:00:00',
    hora_fin: '23:30 hs',
    lugar: 'Canchas de Tenis',
    lugar_detalle: 'Canchas 1 a 6 con iluminación LED.',
    disciplina: 'Tenis',
    categoria: 'Torneos',
    imagen_url: 'images/tennis.png',
    cronograma: [
      { time: '19:00', activity: 'Partidos de zona de grupos' },
      { time: '21:30', activity: 'Cuartos y Semifinales' },
      { time: '22:45', activity: 'Finales simultáneas' }
    ],
    categorias_participantes: ['Dobles Caballeros', 'Dobles Damas', 'Dobles Mixtos'],
    inscripcion_abierta: true,
    inscripcion_limite: '07 Ene 2027',
    inscripcion_contacto: 'tenis@avellanedafc.com',
    reglas: ['Sets de 4 games con punto de oro y tie-break'],
    premios: ['Trofeos de verano y medallas'],
    publicado: true
  },
  {
    id: 24,
    titulo: 'Clínica de Salvamento y Primeros Auxilios Acuáticos',
    descripcion: 'Taller práctico de RCP y seguridad en el agua para profesores y guardavidas.',
    descripcion_larga: 'Capacitación teórico-práctica abierta a guardavidas, profesores y nadadores sobre maniobras de rescate, uso de desfibrilador externo automático (DEA) y primeros auxilios.',
    fecha_hora: '2027-01-13 18:30:00',
    hora_fin: '21:00 hs',
    lugar: 'Piscina Olímpica',
    lugar_detalle: 'Borde de pileta y aula técnica.',
    disciplina: 'Natación',
    categoria: 'Institucionales',
    imagen_url: 'images/pool.png',
    cronograma: [
      { time: '18:30', activity: 'Módulo teórico: Cadena de supervivencia y protocolos' },
      { time: '19:30', activity: 'Práctica de RCP con muñecos de simulación' },
      { time: '20:15', activity: 'Maniobras de rescate acuático directo' }
    ],
    categorias_participantes: ['Profesores, entrenadores, guardavidas y socios mayores de 18'],
    inscripcion_abierta: true,
    inscripcion_limite: '11 Ene 2027',
    inscripcion_contacto: 'capacitacion@avellanedafc.com',
    reglas: ['Asistir con indumentaria acuática y toalla'],
    premios: ['Certificado oficial de asistencia y aprobación'],
    publicado: true
  },
  {
    id: 25,
    titulo: 'Gran Peña Folklórica de Verano',
    descripcion: 'Música folklórica al aire libre en las noches de enero.',
    descripcion_larga: 'La edición de verano de nuestra peña folklórica bajo las estrellas. Grupos de chacarera, zamba y chamamé con espacio para bailar y disfrutar del buffet tradicional.',
    fecha_hora: '2027-01-16 21:00:00',
    hora_fin: '02:30 hs',
    lugar: 'Quincho Principal',
    lugar_detalle: 'Patio de quinchos al aire libre.',
    disciplina: 'Social',
    categoria: 'Sociales',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '21:00', activity: 'Apertura de parrilla y cantina' },
      { time: '22:15', activity: 'Los Huayras de Avellaneda' },
      { time: '23:45', activity: 'Ballet Raíces del Sur' },
      { time: '01:00', activity: 'Chacareras libres y guitarreada' }
    ],
    categorias_participantes: ['Toda la familia'],
    inscripcion_abierta: true,
    inscripcion_limite: 'Mismo día',
    inscripcion_contacto: 'eventos@avellanedafc.com',
    reglas: ['Cuidar la limpieza de los espacios compartidos'],
    premios: [],
    publicado: true
  },
  {
    id: 26,
    titulo: 'Entrenamiento Especial de Pretemporada de Fútbol',
    descripcion: 'Puesta a punto física y técnica en doble turno para juveniles y primera.',
    descripcion_larga: 'Inicio de la preparación física de alto rendimiento para los planteles masculinos y femeninos del club de cara a los torneos de la temporada 2027.',
    fecha_hora: '2027-01-20 08:30:00',
    hora_fin: '12:00 hs',
    lugar: 'Canchas de Fútbol - Sede Principal',
    lugar_detalle: 'Cancha 1 y circuito de fuerza.',
    disciplina: 'Fútbol',
    categoria: 'Deportivos',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '08:30', activity: 'Test de resistencia aeróbica y velocidad' },
      { time: '10:00', activity: 'Trabajos técnicos con balón en espacios reducidos' },
      { time: '11:15', activity: 'Regenerativo y crioterapia' }
    ],
    categorias_participantes: ['Plantel Superior y Cuarta División'],
    inscripcion_abierta: false,
    inscripcion_limite: 'Convocatoria interna',
    inscripcion_contacto: 'futbol@avellanedafc.com',
    reglas: ['Puntualidad e indumentaria oficial de entrenamiento'],
    premios: [],
    publicado: true
  },
  {
    id: 27,
    titulo: 'Encuentro de Vóley Playa y Recreación',
    descripcion: 'Torneo informal 2 vs 2 en la cancha de arena del club.',
    descripcion_larga: 'Disfrutamos del calor compitiendo en arena. Torneo amistoso de beach vóley en parejas para todas las edades con música veraniega y puestos de hidratación.',
    fecha_hora: '2027-01-23 15:30:00',
    hora_fin: '19:30 hs',
    lugar: 'Sector Arena',
    lugar_detalle: 'Cancha de vóley playa.',
    disciplina: 'Vóley',
    categoria: 'Deportivos',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '15:30', activity: 'Sorteo de llaves' },
      { time: '16:00', activity: 'Partidos de zona de grupos' },
      { time: '18:30', activity: 'Finales' }
    ],
    categorias_participantes: ['Parejas Mixtas', 'Parejas Libres'],
    inscripcion_abierta: true,
    inscripcion_limite: '21 Ene 2027',
    inscripcion_contacto: 'voley@avellanedafc.com',
    reglas: ['Reglamento de vóley playa'],
    premios: ['Remeras técnicas para los campeones'],
    publicado: true
  },
  {
    id: 28,
    titulo: 'Clínica de Defensa Personal y Artes Marciales',
    descripcion: 'Técnicas de prevención, escape y manejo de situaciones críticas.',
    descripcion_larga: 'Seminario abierto dictado por los maestros de Judo y Taekwondo del club, orientado a jóvenes y adultos que quieran adquirir herramientas prácticas de autoprotección y confianza.',
    fecha_hora: '2027-01-27 19:00:00',
    hora_fin: '21:00 hs',
    lugar: 'Dojo del Club',
    lugar_detalle: 'Salón de artes marciales con tatami reglamentario.',
    disciplina: 'Artes Marciales',
    categoria: 'Deportivos',
    imagen_url: 'images/gym.png',
    cronograma: [
      { time: '19:00', activity: 'Calentamiento y biomecánica del movimiento' },
      { time: '19:30', activity: 'Técnicas de zafes de agarres y distancia segura' },
      { time: '20:30', activity: 'Resolución de escenarios simulados' }
    ],
    categorias_participantes: ['Mayores de 14 años'],
    inscripcion_abierta: true,
    inscripcion_limite: '25 Ene 2027',
    inscripcion_contacto: 'artesmarciales@avellanedafc.com',
    reglas: ['Ropa deportiva cómoda sin cierres ni botones metálicos', 'Pies descalzos sobre el tatami'],
    premios: ['Certificado de participación'],
    publicado: true
  },
  {
    id: 29,
    titulo: 'Torneo de Verano de Ping Pong y Ajedrez',
    descripcion: 'Jornada de destreza mental y reflejos en la confitería.',
    descripcion_larga: 'Doble torneo simultáneo: mesas de tenis de mesa y tableros de ajedrez reloj suizo a 5 rondas para socios de todas las edades.',
    fecha_hora: '2027-01-30 16:00:00',
    hora_fin: '20:00 hs',
    lugar: 'Confitería del Club',
    lugar_detalle: 'Salón multiuso de confitería.',
    disciplina: 'Recreación',
    categoria: 'Torneos',
    imagen_url: 'images/pool.png',
    cronograma: [
      { time: '16:00', activity: 'Acreditación y sorteo' },
      { time: '16:30', activity: 'Rondas 1 a 3' },
      { time: '18:30', activity: 'Rondas finales y desempates' }
    ],
    categorias_participantes: ['Infantiles', 'Adultos'],
    inscripcion_abierta: true,
    inscripcion_limite: '28 Ene 2027',
    inscripcion_contacto: 'recreacion@avellanedafc.com',
    reglas: ['Sistema Suizo en ajedrez', 'Sets a 11 puntos en tenis de mesa'],
    premios: ['Trofeos y juegos de ajedrez de madera'],
    publicado: true
  },

  // ── FEBRERO 2027 ─────────────────────────────────────────────────────────────
  {
    id: 30,
    titulo: 'Charla Abierta de Nutrición Deportiva y Salud',
    descripcion: 'Pautas de hidratación y alimentación balanceada para atletas y familias.',
    descripcion_larga: 'A cargo del equipo de nutricionistas del club, se brindarán conceptos claros sobre nutrición pre y post entrenamiento, hidratación en días calurosos y hábitos saludables para la vida cotidiana.',
    fecha_hora: '2027-02-03 19:00:00',
    hora_fin: '20:30 hs',
    lugar: 'Salón de Actos',
    lugar_detalle: 'Primer piso de la sede.',
    disciplina: 'Salud',
    categoria: 'Institucionales',
    imagen_url: 'images/gym.png',
    cronograma: [
      { time: '19:00', activity: 'Exposición interactiva con soporte visual' },
      { time: '20:00', activity: 'Ronda de consultas personalizadas' }
    ],
    categorias_participantes: ['Deportistas, padres y socios'],
    inscripcion_abierta: true,
    inscripcion_limite: '02 Feb 2027',
    inscripcion_contacto: 'salud@avellanedafc.com',
    reglas: ['Puntualidad en el ingreso'],
    premios: ['Guías nutricionales digitales gratuitas'],
    publicado: true
  },
  {
    id: 31,
    titulo: 'Torneo Cuadrangular de Fútbol de Pretemporada',
    descripcion: 'Cuadrangular de Primera División con clubes invitados de la liga.',
    descripcion_larga: 'Intenso fin de semana de fútbol en nuestra cancha principal. Cuatro instituciones de gran trayectoria compiten en partidos de 90 minutos para ajustar sus planteles de cara a los torneos oficiales.',
    fecha_hora: '2027-02-06 17:00:00',
    hora_fin: '21:30 hs',
    lugar: 'Canchas de Fútbol - Sede Principal',
    lugar_detalle: 'Cancha 1 con tribuna local y visitante.',
    disciplina: 'Fútbol',
    categoria: 'Torneos',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '17:00', activity: 'Primer partido semifinal' },
      { time: '19:15', activity: 'Segundo partido semifinal' }
    ],
    categorias_participantes: ['Planteles superiores invitados'],
    inscripcion_abierta: false,
    inscripcion_limite: 'Entrada libre para socios',
    inscripcion_contacto: 'futbol@avellanedafc.com',
    reglas: ['Reglamento AFA oficial'],
    premios: ['Copa de Verano Avellaneda FC'],
    publicado: true
  },
  {
    id: 32,
    titulo: 'Clínica de Lanzamientos y Saltos en Atletismo',
    descripcion: 'Capacitación práctica en salto en alto, largo y lanzamiento de jabalina.',
    descripcion_larga: 'Nuestros entrenadores federados dictan una clínica especial orientada a perfeccionar la carrera de impulso, batida y técnica de caída en los fosos de arena y zona de lanzamientos.',
    fecha_hora: '2027-02-10 17:30:00',
    hora_fin: '20:00 hs',
    lugar: 'Pista de Atletismo',
    lugar_detalle: 'Pista sintética y zona de campo.',
    disciplina: 'Atletismo',
    categoria: 'Deportivos',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '17:30', activity: 'Técnica de zancada y aceleración' },
      { time: '18:30', activity: 'Estaciones de salto en largo y triple' },
      { time: '19:15', activity: 'Lanzamiento de bala y jabalina' }
    ],
    categorias_participantes: ['U14, U16, U18 y Mayores'],
    inscripcion_abierta: true,
    inscripcion_limite: '08 Feb 2027',
    inscripcion_contacto: 'atletismo@avellanedafc.com',
    reglas: ['Uso de zapatillas deportivas o clavos reglamentarios'],
    premios: ['Diplomas de capacitación técnica'],
    publicado: true
  },
  {
    id: 33,
    titulo: 'Peña Folklórica y Carnaval de la Familia',
    descripcion: 'Edición especial de carnaval con comparsas y fiesta tradicional.',
    descripcion_larga: 'Festejamos el carnaval en el club uniendo la alegría de las murgas barriales con el folclore norteño tradicional. Puestos de comida típica y música para toda la familia.',
    fecha_hora: '2027-02-13 21:00:00',
    hora_fin: '03:00 hs',
    lugar: 'Quincho Principal',
    lugar_detalle: 'Predio de quinchos y pista exterior.',
    disciplina: 'Social',
    categoria: 'Sociales',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '21:00', activity: 'Apertura con música de carnaval' },
      { time: '22:30', activity: 'Conjunto Folklórico Sol Salteño' },
      { time: '00:00', activity: 'Desfile de comparsas de Avellaneda' },
      { time: '01:15', activity: 'Gran baile familiar' }
    ],
    categorias_participantes: ['Público en general'],
    inscripcion_abierta: true,
    inscripcion_limite: 'Mismo día',
    inscripcion_contacto: 'eventos@avellanedafc.com',
    reglas: ['Prohibida la espuma inflamable dentro de la carpa'],
    premios: ['Premios al mejor disfraz tradicional'],
    publicado: true
  },
  {
    id: 34,
    titulo: 'Evaluaciones Físicas y Funcionales de Temporada',
    descripcion: 'Chequeo de fuerza, movilidad articular y potencia para socios.',
    descripcion_larga: 'El equipo de preparadores físicos del gimnasio ofrece evaluaciones gratuitas de composición corporal, fuerza isométrica y flexibilidad para que cada socio comience el año con un plan a medida.',
    fecha_hora: '2027-02-17 18:00:00',
    hora_fin: '21:00 hs',
    lugar: 'Gimnasio',
    lugar_detalle: 'Sala de musculación y evaluación física.',
    disciplina: 'Fitness',
    categoria: 'Deportivos',
    imagen_url: 'images/gym.png',
    cronograma: [
      { time: '18:00', activity: 'Recepción y fichado inicial' },
      { time: '18:30', activity: 'Batería de tests funcionales' },
      { time: '20:30', activity: 'Entrega de informes y recomendaciones' }
    ],
    categorias_participantes: ['Socios del club de todas las edades'],
    inscripcion_abierta: true,
    inscripcion_limite: '15 Feb 2027',
    inscripcion_contacto: 'gimnasio@avellanedafc.com',
    reglas: ['Asistir con ropa deportiva y toalla'],
    premios: ['Plan de entrenamiento personalizado'],
    publicado: true
  },
  {
    id: 35,
    titulo: 'Copa de Tenis Amistad - Modalidad Mixta',
    descripcion: 'Torneo relámpago de dobles mixtos en un fin de semana a puro tenis.',
    descripcion_larga: 'Una competencia distendida pensada para compartir el deporte en parejas mixtas. Se jugará en sistema de zonas con partidos de sets cortos y definición por súper tie-break.',
    fecha_hora: '2027-02-20 15:00:00',
    hora_fin: '20:00 hs',
    lugar: 'Canchas de Tenis',
    lugar_detalle: 'Canchas de tenis 1 a 4.',
    disciplina: 'Tenis',
    categoria: 'Torneos',
    imagen_url: 'images/tennis.png',
    cronograma: [
      { time: '15:00', activity: 'Sorteo y bienvenida' },
      { time: '15:30', activity: 'Partidos de fase regular' },
      { time: '18:30', activity: 'Semifinales y Final' }
    ],
    categorias_participantes: ['Parejas mixtas socias del club'],
    inscripcion_abierta: true,
    inscripcion_limite: '18 Feb 2027',
    inscripcion_contacto: 'tenis@avellanedafc.com',
    reglas: ['Indumentaria de tenis adecuada', 'Pelotas provistas por la organización'],
    premios: ['Copas para campeones y subcampeones'],
    publicado: true
  },
  {
    id: 36,
    titulo: 'Masterclass de Yoga y Movilidad Articular',
    descripcion: 'Sesión integral de respiración, estiramiento y relajación al atardecer.',
    descripcion_larga: 'Espacio de desconexión y bienestar corporal guiado por especialistas en yoga y técnicas somáticas en el parque verde del club.',
    fecha_hora: '2027-02-24 18:30:00',
    hora_fin: '20:00 hs',
    lugar: 'Salón Multiuso',
    lugar_detalle: 'Salón y parque anexo.',
    disciplina: 'Fitness',
    categoria: 'Deportivos',
    imagen_url: 'images/pool.png',
    cronograma: [
      { time: '18:30', activity: 'Ejercicios de respiración (Pranayama)' },
      { time: '19:00', activity: 'Secuencia de asanas de flexibilidad' },
      { time: '19:40', activity: 'Relajación guiada final' }
    ],
    categorias_participantes: ['Abierto a todos los niveles'],
    inscripcion_abierta: true,
    inscripcion_limite: '23 Feb 2027',
    inscripcion_contacto: 'gimnasio@avellanedafc.com',
    reglas: ['Traer mat de yoga o colchoneta propia'],
    premios: [],
    publicado: true
  },
  {
    id: 37,
    titulo: 'Torneo Relámpago de Vóley Mixto de Verano',
    descripcion: 'Torneo de 6 vs 6 en el polideportivo para cerrar febrero.',
    descripcion_larga: 'Equipos mixtos integrados por socios de vóley formativo, recreativo y federado en un formato relámpago con partidos de 2 sets de 25 puntos.',
    fecha_hora: '2027-02-27 14:30:00',
    hora_fin: '19:30 hs',
    lugar: 'Polideportivo Cubierto',
    lugar_detalle: 'Cancha principal de vóley.',
    disciplina: 'Vóley',
    categoria: 'Torneos',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '14:30', activity: 'Acreditaciones' },
      { time: '15:00', activity: 'Partidos de zona' },
      { time: '18:15', activity: 'Final y premiación' }
    ],
    categorias_participantes: ['Equipos mixtos (mínimo 2 mujeres en cancha)'],
    inscripcion_abierta: true,
    inscripcion_limite: '25 Feb 2027',
    inscripcion_contacto: 'voley@avellanedafc.com',
    reglas: ['Reglamento oficial FIVB adaptado'],
    premios: ['Trofeos y medallas'],
    publicado: true
  },

  // ── MARZO 2027 ───────────────────────────────────────────────────────────────
  {
    id: 38,
    titulo: 'Inicio de Escuelas Formativas Deportivas 2027',
    descripcion: 'Acto de bienvenida e inicio de ciclo para todas las disciplinas infantiles.',
    descripcion_larga: 'Comienza formalmente el año deportivo en Avellaneda FC. Convocamos a todos los chicos inscriptos y a quienes deseen sumarse a conocer a sus profesores, días y horarios de entrenamiento.',
    fecha_hora: '2027-03-03 17:30:00',
    hora_fin: '20:00 hs',
    lugar: 'Sede Principal',
    lugar_detalle: 'Polideportivo y patio central.',
    disciplina: 'Deportes',
    categoria: 'Institucionales',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '17:30', activity: 'Presentación del cuerpo de entrenadores' },
      { time: '18:15', activity: 'Charlas específicas por disciplina' },
      { time: '19:15', activity: 'Merienda de bienvenida compartida' }
    ],
    categorias_participantes: ['Niños y jóvenes de 4 a 17 años'],
    inscripcion_abierta: true,
    inscripcion_limite: 'Inscripciones abiertas todo el mes',
    inscripcion_contacto: 'deportes@avellanedafc.com',
    reglas: ['Traer ficha médica de inicio de temporada'],
    premios: ['Kit de bienvenida para nuevos alumnos'],
    publicado: true
  },
  {
    id: 39,
    titulo: 'Copa Ciudad de Avellaneda - Atletismo en Pista',
    descripcion: 'Torneo intercolegial e interclubes con pruebas de velocidad y saltos.',
    descripcion_larga: 'Competencia federada que convoca a instituciones de toda la zona sur. Carreras de 80m, 100m, 400m, posta 4x100m y salto en largo en nuestra pista homologada.',
    fecha_hora: '2027-03-06 09:30:00',
    hora_fin: '15:00 hs',
    lugar: 'Pista de Atletismo',
    lugar_detalle: 'Pista de 8 carriles y tribuna norte.',
    disciplina: 'Atletismo',
    categoria: 'Torneos',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '09:00', activity: 'Acreditación y entrada en calor' },
      { time: '09:45', activity: 'Series eliminatorias de velocidad' },
      { time: '12:00', activity: 'Finales de salto y lanzamiento' },
      { time: '14:00', activity: 'Premiación oficial' }
    ],
    categorias_participantes: ['Menores (12-14)', 'Juveniles (15-17)', 'Mayores'],
    inscripcion_abierta: true,
    inscripcion_limite: '03 Mar 2027',
    inscripcion_contacto: 'atletismo@avellanedafc.com',
    reglas: ['Reglamento CADA / World Athletics'],
    premios: ['Medallas de oro, plata y bronce por prueba'],
    publicado: true
  },
  {
    id: 40,
    titulo: 'Torneo Inaugural de Básquet Apertura 2027',
    descripcion: 'Arranque de la temporada competitiva con clásico regional de local.',
    descripcion_larga: 'El equipo de Primera División de básquetbol de Avellaneda FC debuta en el Torneo Apertura jugando de local con el aliento de toda nuestra gente.',
    fecha_hora: '2027-03-10 20:30:00',
    hora_fin: '22:45 hs',
    lugar: 'Polideportivo Cubierto',
    lugar_detalle: 'Estadio principal cubierto.',
    disciplina: 'Básquet',
    categoria: 'Torneos',
    imagen_url: 'images/gym.png',
    cronograma: [
      { time: '19:45', activity: 'Presentación de planteles con luces y sonido' },
      { time: '20:30', activity: 'Salto inicial del encuentro' },
      { time: '21:15', activity: 'Espectáculo de entretiempo con el semillero' }
    ],
    categorias_participantes: ['Primera División Masculina'],
    inscripcion_abierta: false,
    inscripcion_limite: 'Acceso para socios con cuota al día',
    inscripcion_contacto: 'basquet@avellanedafc.com',
    reglas: ['Aliento positivo y respeto a las autoridades'],
    premios: [],
    publicado: true
  },
  {
    id: 41,
    titulo: 'Torneo Apertura de Natación por Equipos',
    descripcion: 'Primera fecha del campeonato por puntos de la liga regional.',
    descripcion_larga: 'Nuestra pileta olímpica recibe a 10 equipos de la región para la fecha inaugural del campeonato acuático de la temporada 2027.',
    fecha_hora: '2027-03-13 09:00:00',
    hora_fin: '14:00 hs',
    lugar: 'Piscina Olímpica',
    lugar_detalle: 'Complejo acuático.',
    disciplina: 'Natación',
    categoria: 'Torneos',
    imagen_url: 'images/pool.png',
    cronograma: [
      { time: '08:30', activity: 'Ablande de equipos' },
      { time: '09:30', activity: 'Primer bloque de pruebas individuales' },
      { time: '12:30', activity: 'Pruebas de relevos por equipos' }
    ],
    categorias_participantes: ['Infantiles, Juveniles y Primera'],
    inscripcion_abierta: true,
    inscripcion_limite: '10 Mar 2027',
    inscripcion_contacto: 'natacion@avellanedafc.com',
    reglas: ['Reglamento FENABA'],
    premios: ['Trofeos por puntaje acumulado de equipos'],
    publicado: true
  },
  {
    id: 42,
    titulo: 'Clínica de Táctica y Estrategia de Fútbol Juvenil',
    descripcion: 'Jornada de capacitación para entrenadores, profesores y capitanes de equipo.',
    descripcion_larga: 'El cuerpo técnico de Primera División y el coordinador de fútbol juvenil disertarán sobre transiciones rápidas, presión en campo rival y armado de pelota parada.',
    fecha_hora: '2027-03-17 18:30:00',
    hora_fin: '21:00 hs',
    lugar: 'Salón de Actos y Cancha',
    lugar_detalle: 'Parte teórica en salón, parte práctica en cancha sintética.',
    disciplina: 'Fútbol',
    categoria: 'Deportivos',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '18:30', activity: 'Exposición teórica con video-análisis' },
      { time: '19:45', activity: 'Demostración práctica en cancha' }
    ],
    categorias_participantes: ['Entrenadores, preparadores físicos y jugadores juveniles'],
    inscripcion_abierta: true,
    inscripcion_limite: '15 Mar 2027',
    inscripcion_contacto: 'futbol@avellanedafc.com',
    reglas: ['Cuaderno de notas y calzado adecuado para césped sintético'],
    premios: ['Material pedagógico digital para los participantes'],
    publicado: true
  },
  {
    id: 43,
    titulo: 'Gran Peña Folklórica de Otoño',
    descripcion: 'Música popular, danzas y encuentro criollo en la bienvenida del otoño.',
    descripcion_larga: 'Llega la peña folklórica de marzo en Avellaneda FC. Una noche para cantar, bailar zambas y compartir en familia los sabores de nuestra tierra.',
    fecha_hora: '2027-03-20 21:00:00',
    hora_fin: '02:30 hs',
    lugar: 'Quincho Principal',
    lugar_detalle: 'Quincho cerrado y calefaccionado.',
    disciplina: 'Social',
    categoria: 'Sociales',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '21:00', activity: 'Recepción y apertura gastronómica' },
      { time: '22:15', activity: 'Conjunto Añoranzas Santiagueñas' },
      { time: '23:30', activity: 'Presentación del Ballet Oficial del Club' },
      { time: '00:45', activity: 'Baile popular y guitarreada' }
    ],
    categorias_participantes: ['Socios, familias e invitados'],
    inscripcion_abierta: true,
    inscripcion_limite: 'Mismo día',
    inscripcion_contacto: 'eventos@avellanedafc.com',
    reglas: ['Cuidado de las instalaciones y respeto mutuo'],
    premios: [],
    publicado: true
  },
  {
    id: 44,
    titulo: 'Jornada de Homenaje y Torneo por la Memoria',
    descripcion: 'Actividad deportiva y comunitaria en conmemoración de los derechos humanos.',
    descripcion_larga: 'El deporte como herramienta de memoria, verdad y justicia. Torneo relámpago intercolegial con plantación comunitaria de árboles en el predio del club.',
    fecha_hora: '2027-03-24 10:00:00',
    hora_fin: '14:30 hs',
    lugar: 'Sede Principal',
    lugar_detalle: 'Espacios verdes y canchas exteriores.',
    disciplina: 'Social',
    categoria: 'Institucionales',
    imagen_url: 'images/football_pitch.png',
    cronograma: [
      { time: '10:00', activity: 'Acto institucional y plantación de árboles' },
      { time: '11:00', activity: 'Torneo relámpago mixto de fútbol y vóley' },
      { time: '13:30', activity: 'Palabras de cierre y entrega de diplomas' }
    ],
    categorias_participantes: ['Abierto a toda la comunidad'],
    inscripcion_abierta: true,
    inscripcion_limite: '22 Mar 2027',
    inscripcion_contacto: 'secretaria@avellanedafc.com',
    reglas: ['Respeto irrestricto a los valores democráticos'],
    premios: ['Diplomas conmemorativos'],
    publicado: true
  },
  {
    id: 45,
    titulo: 'Campeonato Metropolitano de Artes Marciales',
    descripcion: 'Torneo interclubes de Taekwondo, Judo y Karate en tatamis simultáneos.',
    descripcion_larga: 'Más de 200 competidores de distintas academias y clubes metropolitanos se darán cita en el Polideportivo para disputar combates de formas (Katas/Poomsae) y lucha reglamentaria.',
    fecha_hora: '2027-03-27 10:00:00',
    hora_fin: '18:00 hs',
    lugar: 'Polideportivo Cubierto',
    lugar_detalle: '4 tatamis oficiales montados en el polideportivo.',
    disciplina: 'Artes Marciales',
    categoria: 'Torneos',
    imagen_url: 'images/gym.png',
    cronograma: [
      { time: '09:30', activity: 'Pesaje oficial y llamado a competidores' },
      { time: '10:30', activity: 'Competencia de Formas infantiles y juveniles' },
      { time: '14:00', activity: 'Combates de graduaciones avanzadas y cinturones negros' },
      { time: '17:30', activity: 'Ceremonia de podio y entrega de medallas' }
    ],
    categorias_participantes: ['Infantiles', 'Juveniles', 'Adultos', 'Master'],
    inscripcion_abierta: true,
    inscripcion_limite: '23 Mar 2027',
    inscripcion_contacto: 'artesmarciales@avellanedafc.com',
    reglas: ['Uso de protecciones homologadas obligatorio', 'Carnet de federación al día'],
    premios: ['Medallas de podio 1°, 2° y 3° puesto', 'Copa por Escuelas'],
    publicado: true
  },
  {
    id: 46,
    titulo: 'Exhibición de Gimnasia Deportiva y Cierre de Mes',
    descripcion: 'Muestra gimnástica de suelo, vigas y acrobacia para toda la familia.',
    descripcion_larga: 'Nuestras gimnastas deslumbrarán en el cierre del mes de marzo con coreografías grupales, saltos acrobáticos y esquemas de suelo con aparatos.',
    fecha_hora: '2027-03-31 18:30:00',
    hora_fin: '21:00 hs',
    lugar: 'Polideportivo Cubierto',
    lugar_detalle: 'Estadio central.',
    disciplina: 'Deportes',
    categoria: 'Deportivos',
    imagen_url: 'images/gym.png',
    cronograma: [
      { time: '18:30', activity: 'Entrada y desfile de las gimnastas' },
      { time: '19:00', activity: 'Rutinas de suelo y aparatos' },
      { time: '20:15', activity: 'Cuadro coreográfico final y reconocimiento' }
    ],
    categorias_participantes: ['Escuela formativa y equipo de competición'],
    inscripcion_abierta: false,
    inscripcion_limite: 'Entrada libre para socios y familiares',
    inscripcion_contacto: 'gimnasia@avellanedafc.com',
    reglas: ['Mantenerse en la tribuna asignada sin traspasar las colchonetas'],
    premios: ['Medallas de honor para todas las deportistas'],
    publicado: true
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
    console.log('📅 AVELLANEDA FC — Migración de Agenda de Eventos');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Conectado a la base de datos:', process.env.DB_NAME || 'avellaneda_fc');

    // 1. Asegurar tabla eventos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS eventos (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(140) NOT NULL,
        descripcion TEXT NOT NULL,
        descripcion_larga LONGTEXT,
        fecha_hora DATETIME NOT NULL,
        hora_fin VARCHAR(30),
        lugar VARCHAR(120) NOT NULL,
        lugar_detalle VARCHAR(255),
        disciplina VARCHAR(60) DEFAULT 'General',
        categoria VARCHAR(60) DEFAULT 'Deportivos',
        imagen_url VARCHAR(255),
        cronograma JSON,
        categorias_participantes JSON,
        inscripcion_abierta BOOLEAN NOT NULL DEFAULT TRUE,
        inscripcion_limite VARCHAR(120),
        inscripcion_contacto VARCHAR(120),
        reglas JSON,
        premios JSON,
        destacado BOOLEAN NOT NULL DEFAULT FALSE,
        publicado BOOLEAN NOT NULL DEFAULT TRUE,
        creado_por INT UNSIGNED NOT NULL DEFAULT 1,
        creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 2. Verificar columnas adicionales si la tabla ya existía
    await addColumnIfMissing(connection, 'eventos', 'descripcion_larga', 'LONGTEXT NULL');
    await addColumnIfMissing(connection, 'eventos', 'hora_fin', 'VARCHAR(30) NULL');
    await addColumnIfMissing(connection, 'eventos', 'lugar_detalle', 'VARCHAR(255) NULL');
    await addColumnIfMissing(connection, 'eventos', 'cronograma', 'JSON NULL');
    await addColumnIfMissing(connection, 'eventos', 'categorias_participantes', 'JSON NULL');
    await addColumnIfMissing(connection, 'eventos', 'inscripcion_abierta', 'BOOLEAN NOT NULL DEFAULT TRUE');
    await addColumnIfMissing(connection, 'eventos', 'inscripcion_limite', 'VARCHAR(120) NULL');
    await addColumnIfMissing(connection, 'eventos', 'inscripcion_contacto', 'VARCHAR(120) NULL');
    await addColumnIfMissing(connection, 'eventos', 'reglas', 'JSON NULL');
    await addColumnIfMissing(connection, 'eventos', 'premios', 'JSON NULL');
    await addColumnIfMissing(connection, 'eventos', 'destacado', 'BOOLEAN NOT NULL DEFAULT FALSE');
    await addColumnIfMissing(connection, 'eventos', 'actualizado_en', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // 3. Poblar / Actualizar cada evento de la agenda
    console.log(`\n📦 Sincronizando ${EVENTOS_DATA.length} eventos (Octubre 2026 - Marzo 2027)...`);
    for (const ev of EVENTOS_DATA) {
      const jsonCronograma = JSON.stringify(ev.cronograma || []);
      const jsonCategorias = JSON.stringify(ev.categorias_participantes || []);
      const jsonReglas = JSON.stringify(ev.reglas || []);
      const jsonPremios = JSON.stringify(ev.premios || []);

      const [existing] = await connection.query('SELECT id FROM eventos WHERE id = ?', [ev.id]);

      if (existing.length > 0) {
        await connection.query(`
          UPDATE eventos
          SET titulo = ?,
              descripcion = ?,
              descripcion_larga = ?,
              fecha_hora = ?,
              hora_fin = ?,
              lugar = ?,
              lugar_detalle = ?,
              disciplina = ?,
              categoria = ?,
              imagen_url = ?,
              cronograma = ?,
              categorias_participantes = ?,
              inscripcion_abierta = ?,
              inscripcion_limite = ?,
              inscripcion_contacto = ?,
              reglas = ?,
              premios = ?,
              publicado = ?
          WHERE id = ?
        `, [
          ev.titulo,
          ev.descripcion,
          ev.descripcion_larga,
          ev.fecha_hora,
          ev.hora_fin,
          ev.lugar,
          ev.lugar_detalle,
          ev.disciplina,
          ev.categoria,
          ev.imagen_url,
          jsonCronograma,
          jsonCategorias,
          ev.inscripcion_abierta,
          ev.inscripcion_limite,
          ev.inscripcion_contacto,
          jsonReglas,
          jsonPremios,
          ev.publicado,
          ev.id
        ]);
        console.log(`  ✔ [ID ${ev.id}] "${ev.titulo}" (${ev.fecha_hora.slice(0, 10)}) actualizado.`);
      } else {
        await connection.query(`
          INSERT INTO eventos (
            id, titulo, descripcion, descripcion_larga, fecha_hora, hora_fin,
            lugar, lugar_detalle, disciplina, categoria, imagen_url,
            cronograma, categorias_participantes, inscripcion_abierta,
            inscripcion_limite, inscripcion_contacto, reglas, premios,
            publicado, creado_por
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [
          ev.id,
          ev.titulo,
          ev.descripcion,
          ev.descripcion_larga,
          ev.fecha_hora,
          ev.hora_fin,
          ev.lugar,
          ev.lugar_detalle,
          ev.disciplina,
          ev.categoria,
          ev.imagen_url,
          jsonCronograma,
          jsonCategorias,
          ev.inscripcion_abierta,
          ev.inscripcion_limite,
          ev.inscripcion_contacto,
          jsonReglas,
          jsonPremios,
          ev.publicado
        ]);
        console.log(`  ✔ [ID ${ev.id}] "${ev.titulo}" (${ev.fecha_hora.slice(0, 10)}) insertado.`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ ÉXITO: Los ${EVENTOS_DATA.length} eventos de Avellaneda FC han sido migrados y actualizados correctamente en MySQL.`);
    console.log('   - Sin costos ni precios monetarios.');
    console.log('   - Con peñas folklóricas mensuales los sábados.');
    console.log('   - Con un mínimo de 2 eventos semanales hasta marzo 2027.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA MIGRACIÓN DE EVENTOS:', error);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigration();
