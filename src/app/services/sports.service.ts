import { Injectable } from '@angular/core';

export interface Sport {
  id: number;
  name: string;
  description: string;
  image: string;
  icon: string;
  athletes: number;
  coaches: number;
  schedule: string;
}

@Injectable({ providedIn: 'root' })
export class SportsService {
  private sports: Sport[] = [
    {
      id: 1, name: 'Fútbol', icon: 'fa-futbol',
      description: 'El deporte más popular del club. Contamos con categorías infantiles, juveniles y adultos para todos los niveles.',
      image: 'images/football_pitch.png', athletes: 120, coaches: 8,
      schedule: 'Lunes, Miércoles y Viernes 16:00 - 20:00'
    },
    {
      id: 2, name: 'Natación', icon: 'fa-water',
      description: 'Piscina olímpica de 50 metros con clases para todas las edades. Desde bebés hasta adultos mayores.',
      image: 'images/pool.png', athletes: 85, coaches: 6,
      schedule: 'Todos los días 7:00 - 22:00'
    },
    {
      id: 3, name: 'Tenis', icon: 'fa-circle',
      description: 'Canchas de polvo de ladrillo y pasto sintético. Clases individuales y grupales con profesores certificados.',
      image: 'images/tennis.png', athletes: 45, coaches: 4,
      schedule: 'Martes, Jueves y Sábados 9:00 - 18:00'
    },
    {
      id: 4, name: 'Gimnasio', icon: 'fa-dumbbell',
      description: 'Equipamiento de última generación, zona de pesas libre, cardio y clases de musculación con entrenadores.',
      image: 'images/gym.png', athletes: 200, coaches: 10,
      schedule: 'Lunes a Sábado 6:00 - 22:00'
    },
    {
      id: 5, name: 'Básquet', icon: 'fa-basketball',
      description: 'Disciplina con fuerte presencia en el club. Categorías menores, juveniles y primera división masculina y femenina.',
      image: 'images/football_pitch.png', athletes: 60, coaches: 5,
      schedule: 'Lunes, Miércoles y Viernes 18:00 - 21:00'
    },
    {
      id: 6, name: 'Vóley', icon: 'fa-volleyball-ball',
      description: 'Equipos masculinos y femeninos en competencia regional. Escuela de voleibol para niños desde los 8 años.',
      image: 'images/football_pitch.png', athletes: 40, coaches: 3,
      schedule: 'Martes y Jueves 19:00 - 21:00'
    },
    {
      id: 7, name: 'Atletismo', icon: 'fa-person-running',
      description: 'Pista de atletismo homologada con entrenadores especializados en velocidad, fondo y pruebas de campo.',
      image: 'images/football_pitch.png', athletes: 30, coaches: 3,
      schedule: 'Lunes a Viernes 7:00 - 9:00 y 17:00 - 19:00'
    },
    {
      id: 8, name: 'Artes Marciales', icon: 'fa-hand-fist',
      description: 'Judo, Karate y Taekwondo con instructores certificados. Desarrollo de disciplina, respeto y habilidades de defensa personal.',
      image: 'images/gym.png', athletes: 35, coaches: 4,
      schedule: 'Martes, Jueves y Sábados 10:00 - 12:00'
    }
  ];

  getAll(): Sport[] { return this.sports; }
  getById(id: number): Sport | undefined { return this.sports.find(s => s.id === id); }
  search(query: string): Sport[] {
    return this.sports.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
  }
  getStats() {
    return { disciplines: 12, athletes: 300, coaches: 45, members: 1500 };
  }
}
