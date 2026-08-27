import { Injectable } from '@angular/core';

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  day: string;
  month: string;
  time: string;
  location: string;
  discipline: string;
  category: string;
  image: string;
}

@Injectable({ providedIn: 'root' })
export class EventsService {
  private events: Event[] = [
    {
      id: 1,
      title: 'Torneo Interclubes de Fútbol',
      description: 'Gran torneo regional con la participación de más de 20 clubes de la zona. Categorías Sub-15, Sub-17 y Primera División.',
      date: '15 Sep 2025', day: '15', month: 'SEP',
      time: '09:00 hs', location: 'Canchas de Fútbol - Sede Principal',
      discipline: 'Fútbol', category: 'Torneos',
      image: 'images/football_pitch.png'
    },
    {
      id: 2,
      title: 'Campeonato de Tenis 2025',
      description: 'Torneo interno anual de tenis con categorías singles y dobles. Premios para los tres primeros puestos de cada categoría.',
      date: '22 Sep 2025', day: '22', month: 'SEP',
      time: '10:00 hs', location: 'Canchas de Tenis',
      discipline: 'Tenis', category: 'Deportivos',
      image: 'images/tennis.png'
    },
    {
      id: 3,
      title: 'Liga Regional de Básquet - Final',
      description: 'La gran final de la liga regional donde Avellaneda FC buscará el campeonato. No te pierdas este emocionante encuentro.',
      date: '5 Oct 2025', day: '05', month: 'OCT',
      time: '20:00 hs', location: 'Polideportivo Cubierto',
      discipline: 'Básquet', category: 'Deportivos',
      image: 'images/football_pitch.png'
    },
    {
      id: 4,
      title: 'Cena Anual del Club',
      description: 'Celebramos otro año de crecimiento con nuestra cena anual. Música en vivo, gastronomía y la premiación de los mejores atletas del año.',
      date: '20 Nov 2025', day: '20', month: 'NOV',
      time: '21:00 hs', location: 'Salón de Eventos - Sede Principal',
      discipline: 'Social', category: 'Sociales',
      image: 'images/football_pitch.png'
    }
  ];

  getAll(): Event[] { return this.events; }
  getUpcoming(n?: number): Event[] { return n ? this.events.slice(0, n) : this.events; }
  getByCategory(cat: string): Event[] {
    if (cat === 'Todos') return this.events;
    return this.events.filter(e => e.category === cat);
  }
  getCategories(): string[] { return ['Todos los eventos', 'Deportivos', 'Torneos', 'Sociales', 'Institucionales']; }
}
