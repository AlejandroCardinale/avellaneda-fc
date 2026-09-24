import { Injectable } from '@angular/core';

export interface Facility {
  id: number;
  name: string;
  description: string;
  longDescription: string;
  image: string;
  icon: string;
  label: string;
  features: string[];
  technicalSpecs: { key: string; value: string }[];
  schedule: string;
  regulations: string[];
  equipment: string[];
}

@Injectable({ providedIn: 'root' })
export class FacilitiesService {
  private facilities: Facility[] = [
    {
      id: 1, name: 'Cancha de Fútbol', icon: 'fa-futbol', label: 'Deportiva',
      description: 'Cancha de césped natural de dimensiones reglamentarias con iluminación LED para partidos nocturnos.',
      longDescription: 'La cancha de fútbol de Avellaneda FC es el corazón del club. Con dimensiones reglamentarias y césped natural de alta calidad, ha sido escenario de cientos de partidos memorables a lo largo de la historia del club. La instalación cuenta con iluminación LED de alto rendimiento que permite la realización de entrenamientos y competencias nocturnas con visibilidad óptima. La tribuna cubierta con capacidad para 500 espectadores ofrece una experiencia inigualable para quienes siguen a sus equipos en casa.',
      image: 'images/football_pitch.png',
      features: ['Césped natural reglamentario', 'Iluminación LED', 'Tribuna cubierta', 'Vestuarios próximos'],
      technicalSpecs: [
        { key: 'Dimensiones', value: '105 × 68 metros' },
        { key: 'Superficie', value: 'Césped natural bermuda' },
        { key: 'Iluminación', value: '1500 lux (LED profesional)' },
        { key: 'Capacidad tribuna', value: '500 espectadores' },
        { key: 'Año de remodelación', value: '2023' },
        { key: 'Norma', value: 'FIFA Quality Pro' }
      ],
      schedule: 'Lunes a Viernes 9:00 - 22:00 / Sábados y Domingos 8:00 - 20:00',
      regulations: [
        'Obligatorio el uso de botines o zapatillas deportivas adecuadas',
        'Prohibido el ingreso con botines de tapones de metal',
        'El acceso a la cancha requiere autorización del personal del club',
        'Prohibido fumar y consumir alcohol dentro del predio',
        'Los menores de 14 años deben estar acompañados por un adulto'
      ],
      equipment: [
        'Arcos reglamentarios con redes',
        'Banderines de córner',
        'Tablero marcador electrónico',
        'Sistema de riego automático',
        'Banco de suplentes cubierto',
        'Mesa de control y cronometraje'
      ]
    },
    {
      id: 2, name: 'Piscina Olímpica', icon: 'fa-water', label: 'Acuática',
      description: 'Piscina olímpica de 50 metros con 8 carriles, temperatura regulada y sistema de filtrado de última generación.',
      longDescription: 'La Piscina Olímpica de Avellaneda FC es una de las instalaciones acuáticas más completas de la región. Con sus 50 metros de longitud divididos en 8 carriles de competencia, ha sido sede de múltiples torneos provinciales de natación. El sistema de climatización mantiene el agua a temperatura constante de 26-28°C durante todo el año, permitiendo el uso pleno de las instalaciones independientemente de la estación. Una pileta auxiliar temperada de 25 metros complementa la oferta para la enseñanza de natación a niños y principiantes.',
      image: 'images/pool.png',
      features: ['50 metros / 8 carriles', 'Temperatura regulada', 'Tribuna de espectadores', 'Trampolín y plataforma'],
      technicalSpecs: [
        { key: 'Largo', value: '50 metros' },
        { key: 'Ancho', value: '25 metros (8 carriles)' },
        { key: 'Profundidad', value: '1.80m a 2.00m' },
        { key: 'Temperatura', value: '26-28 °C' },
        { key: 'Sistema de filtrado', value: 'Ultravioleta + cloración automática' },
        { key: 'Norma', value: 'FINA / World Aquatics' }
      ],
      schedule: 'Lunes a Viernes 6:30 - 22:00 / Sábados 7:00 - 20:00 / Domingos 8:00 - 18:00',
      regulations: [
        'Obligatorio el uso de gorro de natación en todo momento',
        'Obligatorio ducharse antes de ingresar al agua',
        'Prohibido correr en el área de la piscina',
        'Prohibido el ingreso con comida o bebidas al área acuática',
        'Los niños menores de 8 años deben estar acompañados por un adulto',
        'Respetar los carriles asignados según el nivel de natación'
      ],
      equipment: [
        'Bloques de salida de competencia',
        'Cronómetro electrónico con foto finish',
        'Corcheras de separación de carriles',
        'Trampolín de 1 metro y plataforma de 3 metros',
        'Tablas y pull-buoys para entrenamiento',
        'Sistema de megafonía para competencias'
      ]
    },
    {
      id: 3, name: 'Gimnasio', icon: 'fa-dumbbell', label: 'Fitness',
      description: 'Más de 800m² con equipamiento de última generación. Zona de musculación, cardio y clases grupales.',
      longDescription: 'El Gimnasio de Avellaneda FC es un espacio de entrenamiento de alta performance con más de 800 m² distribuidos en tres zonas especializadas. La sala de musculación cuenta con el equipamiento más moderno del mercado, importado de marcas líderes como Technogym y Life Fitness. La zona cardiovascular ofrece más de 30 máquinas de última generación con pantallas individuales integradas. El salón de clases grupales se usa para spinning, entrenamiento funcional, pilates, yoga y zumba, con capacidad para 25 personas simultáneas.',
      image: 'images/gym.png',
      features: ['800m² de superficie', 'Equipos de última generación', 'Zona cardio y musculación', 'Clases grupales incluidas'],
      technicalSpecs: [
        { key: 'Superficie total', value: '800 m²' },
        { key: 'Zona musculación', value: '400 m²' },
        { key: 'Zona cardiovascular', value: '200 m²' },
        { key: 'Salón clases grupales', value: '200 m²' },
        { key: 'Capacidad simultánea', value: '80 personas' },
        { key: 'Año de equipamiento', value: '2024' }
      ],
      schedule: 'Lunes a Viernes 6:00 - 23:00 / Sábados 7:00 - 21:00 / Domingos 8:00 - 20:00',
      regulations: [
        'Obligatorio el uso de ropa deportiva y zapatillas cerradas',
        'Obligatorio el uso de toalla personal en todas las máquinas',
        'Limpiar el equipo con el spray desinfectante provisto después de su uso',
        'Respetar los turnos de uso de las máquinas en horarios pico',
        'Prohibido el ingreso con bolsos grandes al área de entrenamiento',
        'Los menores de 16 años deben tener autorización médica y de sus padres'
      ],
      equipment: [
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
      id: 4, name: 'Canchas de Tenis', icon: 'fa-circle', label: 'Deportiva',
      description: 'Seis canchas profesionales (4 clay + 2 pasto sintético) con iluminación LED. Superficies variadas para adaptarse a todos los estilos de juego.',
      longDescription: 'El complejo de tenis de Avellaneda FC cuenta con seis canchas profesionales que cubren las principales superficies de juego: polvo de ladrillo (clay), pasto sintético y superficie dura. Esta variedad permite que los jugadores desarrollen habilidades completas y se adapten a cualquier tipo de torneo. Las canchas están numeradas del 1 al 6 y todas cuentan con iluminación LED para partidos nocturnos. El pro shop del club ofrece encordado profesional, venta y alquiler de raquetas, y accesorios de la marca Wilson y Head.',
      image: 'images/tennis.png',
      features: ['6 canchas (4 clay + 2 sintético)', 'Polvo de ladrillo y sintético', 'Iluminación nocturna', 'Alquiler de raquetas'],
      technicalSpecs: [
        { key: 'Cantidad de canchas', value: '6 (4 clay + 2 sintético)' },
        { key: 'Dimensiones', value: '23.77 × 10.97 metros' },
        { key: 'Superficie clay', value: 'Polvo de ladrillo certificado' },
        { key: 'Superficie sintética', value: 'Pasto sintético GreenSet' },
        { key: 'Iluminación', value: '500 lux (LED)' },
        { key: 'Norma', value: 'ITF - International Tennis Federation' }
      ],
      schedule: 'Lunes a Viernes 7:00 - 23:00 / Sábados 7:00 - 22:00 / Domingos 8:00 - 20:00',
      regulations: [
        'Obligatorio el uso de zapatillas específicas para tenis (no running)',
        'En canchas de polvo de ladrillo, respetar el marcado con las líneas',
        'Reservar la cancha con mínimo 24 horas de anticipación',
        'Máximo 2 horas de uso consecutivo por turno en horarios pico',
        'Las pelotas deben comprarse o alquilarse en el pro shop del club',
        'Prohibido el ingreso a las canchas con alimentos o bebidas con azúcar'
      ],
      equipment: [
        'Redes reglamentarias ajustables',
        'Máquina lanzapelotas automática (disponible para alquiler)',
        'Sillas de árbitro con parasol',
        'Tablero de puntuación manual y electrónico',
        'Stock de pelotas Wilson y Head para alquiler',
        'Raquetas de diferentes niveles para alquiler'
      ]
    }
  ];

  getAll(): Facility[] { return this.facilities; }
  getById(id: number): Facility | undefined { return this.facilities.find(f => f.id === id); }

  getServices() {
    return [
      { icon: 'fa-shower', label: 'Vestuarios y duchas' },
      { icon: 'fa-spa', label: 'Sala de masajes' },
      { icon: 'fa-kit-medical', label: 'Enfermería y primeros auxilios' },
      { icon: 'fa-umbrella-beach', label: 'Quincho para eventos' },
      { icon: 'fa-utensils', label: 'Buffet / Kiosco saludable' },
      { icon: 'fa-square-parking', label: 'Estacionamiento gratuito' }
    ];
  }
}
