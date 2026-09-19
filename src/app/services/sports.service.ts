import { Injectable } from '@angular/core';

export interface Sport {
  id: number;
  name: string;
  description: string;
  longDescription: string;
  image: string;
  icon: string;
  athletes: number;
  coaches: number;
  schedule: string;
  features: string[];
  categories: string[];
}

@Injectable({ providedIn: 'root' })
export class SportsService {
  private sports: Sport[] = [
    {
      id: 1, name: 'Fútbol', icon: 'fa-futbol',
      description: 'El deporte más popular del club. Contamos con categorías infantiles, juveniles y adultos para todos los niveles.',
      longDescription: 'El fútbol es la disciplina insignia de Avellaneda FC. Desde sus inicios, el club ha formado a cientos de jugadores que hoy compiten en ligas locales y regionales. Nuestro programa formativo abarca desde la categoría Baby Fútbol hasta el plantel de Primera División adulta, con entrenamiento técnico, táctico y físico de alto nivel. Las canchas profesionales de césped natural y sintético permiten entrenar durante todo el año bajo las mejores condiciones.',
      image: 'images/football_pitch.png', athletes: 120, coaches: 8,
      schedule: 'Lunes, Miércoles y Viernes 16:00 - 20:00',
      features: [
        'Canchas profesionales de césped natural y sintético',
        'Vestuarios renovados con duchas individuales',
        'Iluminación LED para entrenamientos nocturnos',
        'Sistema de video análisis para mejora táctica',
        'Equipo médico y de kinesiología en cada práctica'
      ],
      categories: ['Baby Fútbol (5-7 años)', 'Infantil (8-11 años)', 'Cadetes (12-14 años)', 'Juveniles (15-18 años)', 'Sub-20', 'Primera División Masculina', 'Primera División Femenina']
    },
    {
      id: 2, name: 'Natación', icon: 'fa-water',
      description: 'Piscina olímpica de 50 metros con clases para todas las edades. Desde bebés hasta adultos mayores.',
      longDescription: 'La natación en Avellaneda FC cuenta con una piscina olímpica de 50 metros y una pileta de aprendizaje para los más pequeños. Ofrecemos clases para todas las edades y niveles, desde la estimulación temprana para bebés hasta la natación recreativa y competitiva para adultos. Nuestros profesores están certificados por la Federación Argentina de Natación y trabajan con metodologías modernas que garantizan una progresión segura y efectiva en el agua.',
      image: 'images/pool.png', athletes: 85, coaches: 6,
      schedule: 'Todos los días 7:00 - 22:00',
      features: [
        'Piscina olímpica de 50 metros con 8 carriles',
        'Pileta de aprendizaje temperada para niños',
        'Temperatura controlada durante todo el año',
        'Sistema de purificación de agua de última generación',
        'Cronometraje electrónico para competencias'
      ],
      categories: ['Estimulación acuática (6 meses - 2 años)', 'Baby natación (3-4 años)', 'Infantil (5-9 años)', 'Junior (10-14 años)', 'Adultos', 'Adultos mayores', 'Natación competitiva']
    },
    {
      id: 3, name: 'Tenis', icon: 'fa-circle',
      description: 'Canchas de polvo de ladrillo y pasto sintético. Clases individuales y grupales con profesores certificados.',
      longDescription: 'El tenis en Avellaneda FC dispone de canchas de polvo de ladrillo y pasto sintético, ideales para jugadores de todos los estilos. Nuestros profesores certificados por la Asociación Argentina de Tenis brindan clases individuales y grupales para niños, jóvenes y adultos, con programas adaptados a cada nivel. El club también organiza torneos internos y participa en competencias zonales, brindando a los jugadores la posibilidad de medir su progreso.',
      image: 'images/tennis.png', athletes: 45, coaches: 4,
      schedule: 'Martes, Jueves y Sábados 9:00 - 18:00',
      features: [
        '4 canchas de polvo de ladrillo profesionales',
        '2 canchas de pasto sintético',
        'Iluminación para partidos nocturnos',
        'Maquinaria lanzapelotas para entrenamiento',
        'Pro shop con equipamiento y encordado'
      ],
      categories: ['Mini tenis (4-7 años)', 'Infantil (8-11 años)', 'Juvenil (12-17 años)', 'Adultos principiantes', 'Adultos intermedios', 'Adultos avanzados', 'Clases individuales personalizadas']
    },
    {
      id: 4, name: 'Gimnasio', icon: 'fa-dumbbell',
      description: 'Equipamiento de última generación, zona de pesas libre, cardio y clases de musculación con entrenadores.',
      longDescription: 'El gimnasio de Avellaneda FC es un espacio de entrenamiento de alta performance con más de 600 m² de superficie. Contamos con equipamiento de última generación importado: máquinas de musculación, zona de pesas libres con barras olímpicas, plataformas de levantamiento, área cardiovascular con cintas, bicicletas y elípticas. Los entrenadores personales certificados elaboran planes de entrenamiento individualizados según los objetivos de cada socio.',
      image: 'images/gym.png', athletes: 200, coaches: 10,
      schedule: 'Lunes a Sábado 6:00 - 22:00',
      features: [
        'Más de 600 m² de espacio de entrenamiento',
        'Zona de musculación con máquinas de última generación',
        'Área de pesas libres con plataformas olímpicas',
        'Sala cardiovascular con 30+ máquinas',
        'Salón de clases grupales (spinning, funcional, pilates)',
        'Vestuarios equipados con casilleros y duchas'
      ],
      categories: ['Musculación y fuerza', 'Entrenamiento funcional', 'Cardio y resistencia', 'Spinning', 'Pilates', 'Clases grupales', 'Entrenamiento personal']
    },
    {
      id: 5, name: 'Básquet', icon: 'fa-basketball',
      description: 'Disciplina con fuerte presencia en el club. Categorías menores, juveniles y primera división masculina y femenina.',
      longDescription: 'El básquet es una de las disciplinas con mayor tradición en Avellaneda FC, con más de 30 años de historia competitiva. El club participa activamente en la liga zonal y ha formado a jugadores que lograron destacarse a nivel provincial. La escuela de básquet brinda formación integral desde los 7 años, trabajando valores como el trabajo en equipo, el respeto y la superación personal. Los equipos masculino y femenino de primera división compiten en divisionales regionales con buenos resultados.',
      image: 'images/football_pitch.png', athletes: 60, coaches: 5,
      schedule: 'Lunes, Miércoles y Viernes 18:00 - 21:00',
      features: [
        'Cancha techada de madera reglamentaria',
        'Tableros con aro regulables para todas las alturas',
        'Sistema de marcador electrónico',
        'Gradería para 200 espectadores',
        'Vestuarios equipados para hombres y mujeres'
      ],
      categories: ['Escuelita (7-9 años)', 'Premini (10-11 años)', 'Mini (12-13 años)', 'U15 Masculino y Femenino', 'U17 Masculino y Femenino', 'Primera División Masculina', 'Primera División Femenina']
    },
    {
      id: 6, name: 'Vóley', icon: 'fa-volleyball-ball',
      description: 'Equipos masculinos y femeninos en competencia regional. Escuela de voleibol para niños desde los 8 años.',
      longDescription: 'El vóley en Avellaneda FC cuenta con una sólida estructura formativa y competitiva. La escuela infantil recibe a niños desde los 8 años enseñando los fundamentos del juego en un ambiente divertido y motivador. Los equipos de adultos participan en la competencia regional con un plantel masculino y femenino bien consolidados. El club cuenta con canchas interiores de piso de madera y canchas de vóley playa para enriquecer la experiencia deportiva.',
      image: 'images/football_pitch.png', athletes: 40, coaches: 3,
      schedule: 'Martes y Jueves 19:00 - 21:00',
      features: [
        'Cancha interior reglamentaria de piso de madera',
        'Cancha exterior de vóley playa',
        'Red electrónica con tensión regulable',
        'Entrenamiento con análisis de video',
        'Participación en torneos regionales y nacionales'
      ],
      categories: ['Escuelita (8-10 años)', 'Infantil (11-12 años)', 'Cadetes (13-14 años)', 'Juveniles (15-17 años)', 'Primera División Masculina', 'Primera División Femenina', 'Vóley playa mixto']
    },
    {
      id: 7, name: 'Atletismo', icon: 'fa-person-running',
      description: 'Pista de atletismo homologada con entrenadores especializados en velocidad, fondo y pruebas de campo.',
      longDescription: 'La sección de atletismo de Avellaneda FC dispone de una pista homologada de 8 carriles donde se trabajan todas las especialidades olímpicas: velocidad (100m, 200m, 400m), medio fondo, fondo, salto en largo, salto en alto, triple salto, lanzamiento de bala, disco y jabalina. Nuestros entrenadores son ex-atletas de alto rendimiento con experiencia en competencias nacionales e internacionales, garantizando una formación de excelencia.',
      image: 'images/football_pitch.png', athletes: 30, coaches: 3,
      schedule: 'Lunes a Viernes 7:00 - 9:00 y 17:00 - 19:00',
      features: [
        'Pista homologada de 400 metros con 8 carriles',
        'Zona de saltos con foso de arena profesional',
        'Área de lanzamientos equipada y señalizada',
        'Implementos reglamentarios (bala, disco, jabalina)',
        'Cronómetro electrónico y sistema de foto finish'
      ],
      categories: ['Iniciación (8-11 años)', 'Menores (12-14 años)', 'Juveniles (15-17 años)', 'Sub-23', 'Mayores - Velocidad', 'Mayores - Fondo y medio fondo', 'Mayores - Pruebas de campo']
    },
    {
      id: 8, name: 'Artes Marciales', icon: 'fa-hand-fist',
      description: 'Judo, Karate y Taekwondo con instructores certificados. Desarrollo de disciplina, respeto y habilidades de defensa personal.',
      longDescription: 'Las Artes Marciales en Avellaneda FC comprenden tres disciplinas olímpicas: Judo, Karate y Taekwondo. Cada una cuenta con instructores certificados internacionalmente que transmiten no solo las técnicas de combate, sino también los valores fundamentales de disciplina, respeto, perseverancia y autocontrol. Los alumnos pueden participar en competencias interclubs, zonales y provinciales, logrando un desarrollo personal integral que trasciende el tatami.',
      image: 'images/gym.png', athletes: 35, coaches: 4,
      schedule: 'Martes, Jueves y Sábados 10:00 - 12:00',
      features: [
        'Dojo equipado con tatami de goma de alta densidad',
        'Sala específica de Taekwondo con espejos',
        'Instructores con certificación internacional (Dan)',
        'Equipamiento de protección completo disponible',
        'Preparación para competencias federadas'
      ],
      categories: ['Judo infantil (5-11 años)', 'Judo juvenil y adultos', 'Karate Shotokan (todas las edades)', 'Taekwondo infantil (6-11 años)', 'Taekwondo juvenil y adultos', 'Defensa personal (adultos)', 'Competencia federada']
    }
  ];

  getAll(): Sport[] { return this.sports; }
  getById(id: number): Sport | undefined { return this.sports.find(s => s.id === id); }
  search(query: string): Sport[] {
    return this.sports.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
  }
  getStats() {
    return { disciplines: 8, athletes: 300, coaches: 45, members: 1500 };
  }
}
