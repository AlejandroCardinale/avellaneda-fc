import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface News {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  image: string;
  featured?: boolean;
}

interface PublicNewsResponse {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  imagen_url: string | null;
  destacada: boolean;
  fecha_publicacion: string;
}

@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly api = `${environment.apiUrl}/noticias`;

  constructor(private http: HttpClient) {}

  private news: News[] = [
    {
      id: 1,
      title: 'Torneo Interclubes 2025',
      description: 'Avellaneda FC participará en el torneo interclubes de la región. Más de 20 equipos competirán en múltiples disciplinas durante el mes de septiembre.',
      category: 'Deportes',
      date: '10 Ago 2025',
      image: 'images/football_pitch.png',
      featured: true
    },
    {
      id: 2,
      title: 'Nueva Cancha de Tenis Inaugurada',
      description: 'Inauguramos dos nuevas canchas de tenis con superficie de pasto sintético de alta calidad, disponibles para todos los socios del club.',
      category: 'Institucional',
      date: '5 Ago 2025',
      image: 'images/tennis.png'
    },
    {
      id: 3,
      title: 'Convocatoria Equipo Juvenil',
      description: 'Se abren las inscripciones para los equipos juveniles de fútbol y básquet. Convocamos jugadores de 14 a 18 años para las categorías Sub-15 y Sub-17.',
      category: 'Deportes',
      date: '1 Ago 2025',
      image: 'images/football_pitch.png'
    },
    {
      id: 4,
      title: 'Horarios de Piscina Olímpica',
      description: 'Se actualizan los horarios de la piscina olímpica para el segundo semestre. Nuevos turnos de natación libre y clases grupales disponibles.',
      category: 'Comunicados',
      date: '28 Jul 2025',
      image: 'images/pool.png'
    },
    {
      id: 5,
      title: 'Premiación Anual de Deportistas',
      description: 'El club celebra su ceremonia anual de premiación donde se reconocerán los logros más destacados de nuestros atletas durante el año.',
      category: 'Eventos',
      date: '20 Jul 2025',
      image: 'images/football_pitch.png'
    },
    {
      id: 6,
      title: 'Nuevos Equipos en el Gimnasio',
      description: 'El gimnasio incorpora 15 nuevas máquinas de última generación, incluyendo equipos cardio y de musculación para todos los niveles.',
      category: 'Institucional',
      date: '15 Jul 2025',
      image: 'images/gym.png'
    },
    {
      id: 7,
      title: 'Avanzan las obras en nuestras instalaciones',
      description: 'Nuevos vestuarios y espacios de entrenamiento para seguir creciendo juntos. Las obras estarán finalizadas a fin de año.',
      category: 'Institucional',
      date: '8 Jul 2025',
      image: 'images/pool.png',
      featured: true
    }
  ];

  getAll(): News[] { return this.news; }
  getFeatured(): News[] { return this.news.filter(n => n.featured); }
  getLatest(): News { return this.news[0]; }
  getByCategory(cat: string): News[] {
    if (cat === 'Todas') return this.news;
    return this.news.filter(n => n.category === cat);
  }
  getCategories(): string[] { return ['Todas', 'Institucional', 'Deportes', 'Eventos', 'Comunicados']; }

  getPublicNews(): Observable<News[]> {
    return this.http.get<PublicNewsResponse[]>(`${this.api}/publicas`).pipe(
      map(rows => rows.map(row => ({
        id: row.id,
        title: row.titulo,
        description: row.descripcion,
        category: row.categoria,
        date: this.formatDate(row.fecha_publicacion),
        image: row.imagen_url || 'images/football_pitch.png',
        featured: row.destacada
      })))
    );
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  }
}
