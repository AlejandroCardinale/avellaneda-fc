import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EventScheduleItem {
  time: string;
  activity: string;
}

export interface EventInscription {
  open: boolean;
  deadline: string;
  contact: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  longDescription: string;
  date: string;
  isoDate: string;
  day: string;
  month: string;
  year?: string;
  time: string;
  endTime: string;
  location: string;
  locationDetail: string;
  discipline: string;
  category: string;
  image: string;
  schedule: EventScheduleItem[];
  categories: string[];
  inscription: EventInscription;
  rules: string[];
  prizes: string[];

  // Campos directos de base de datos MySQL para compatibilidad total con panel de administración
  titulo?: string;
  descripcion?: string;
  descripcion_larga?: string;
  fecha_hora?: string;
  hora_fin?: string;
  lugar?: string;
  lugar_detalle?: string;
  disciplina?: string;
  categoria?: string;
  imagen_url?: string;
  cronograma?: EventScheduleItem[];
  categorias_participantes?: string[];
  inscripcion_abierta?: boolean;
  inscripcion_limite?: string;
  inscripcion_contacto?: string;
  reglas?: string[];
  premios?: string[];
  publicado?: boolean;
  destacado?: boolean;
}

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly apiUrl = `${environment.apiUrl}/eventos`;

  constructor(private http: HttpClient) {}

  private parseJson(val: any, fallback: any = []): any {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }

  private mapEvent(item: any): Event {
    const schedule = Array.isArray(item.schedule)
      ? item.schedule
      : (Array.isArray(item.cronograma)
          ? item.cronograma
          : this.parseJson(item.cronograma, []));

    const categories = Array.isArray(item.categories)
      ? item.categories
      : (Array.isArray(item.categorias_participantes)
          ? item.categorias_participantes
          : this.parseJson(item.categorias_participantes, []));

    const rules = Array.isArray(item.rules)
      ? item.rules
      : (Array.isArray(item.reglas)
          ? item.reglas
          : this.parseJson(item.reglas, []));

    const prizes = Array.isArray(item.prizes)
      ? item.prizes
      : (Array.isArray(item.premios)
          ? item.premios
          : this.parseJson(item.premios, []));

    const inscription: EventInscription = item.inscription || {
      open: item.inscripcion_abierta !== undefined ? Boolean(item.inscripcion_abierta) : true,
      deadline: item.inscripcion_limite || '',
      contact: item.inscripcion_contacto || ''
    };

    return {
      id: Number(item.id),
      title: item.title || item.titulo || '',
      titulo: item.titulo || item.title || '',
      description: item.description || item.descripcion || '',
      descripcion: item.descripcion || item.description || '',
      longDescription: item.longDescription || item.descripcion_larga || item.descripcion || item.description || '',
      descripcion_larga: item.descripcion_larga || item.longDescription || item.descripcion || '',
      date: item.date || '',
      isoDate: item.isoDate || '',
      day: item.day || '01',
      month: item.month || 'ENE',
      year: item.year || (item.isoDate ? item.isoDate.split('-')[0] : '2026'),
      time: item.time || '',
      fecha_hora: item.fecha_hora || '',
      endTime: item.endTime || item.hora_fin || '',
      hora_fin: item.hora_fin || item.endTime || '',
      location: item.location || item.lugar || '',
      lugar: item.lugar || item.location || '',
      locationDetail: item.locationDetail || item.lugar_detalle || '',
      lugar_detalle: item.lugar_detalle || item.locationDetail || '',
      discipline: item.discipline || item.disciplina || 'General',
      disciplina: item.disciplina || item.discipline || 'General',
      category: item.category || item.categoria || 'Sociales',
      categoria: item.categoria || item.category || 'Sociales',
      image: item.image || item.imagen_url || 'images/football_pitch.png',
      imagen_url: item.imagen_url || item.image || 'images/football_pitch.png',
      schedule,
      cronograma: schedule,
      categories,
      categorias_participantes: categories,
      inscription,
      inscripcion_abierta: inscription.open,
      inscripcion_limite: inscription.deadline,
      inscripcion_contacto: inscription.contact,
      rules,
      reglas: rules,
      prizes,
      premios: prizes,
      publicado: item.publicado !== false,
      destacado: Boolean(item.destacado)
    };
  }

  getAll(params?: { search?: string; categoria?: string; publicado?: string }): Observable<Event[]> {
    let httpParams = new HttpParams();
    if (params?.search?.trim()) httpParams = httpParams.set('search', params.search.trim());
    if (params?.categoria) {
      const catNorm = params.categoria.trim().toLowerCase();
      const ignoredCategories = ['todos', 'todas', 'todos los eventos', 'todas las categorías', 'todas las categorias'];
      if (!ignoredCategories.includes(catNorm)) {
        httpParams = httpParams.set('categoria', params.categoria.trim());
      }
    }
    if (params?.publicado) httpParams = httpParams.set('publicado', params.publicado);

    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      map(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        return list.map((item: any) => this.mapEvent(item));
      })
    );
  }

  getById(id: number): Observable<Event> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => this.mapEvent(res?.data || res))
    );
  }

  getUpcoming(n?: number): Observable<Event[]> {
    return this.getAll().pipe(
      map(events => {
        const sorted = [...events].sort((a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime());
        return n ? sorted.slice(0, n) : sorted;
      })
    );
  }

  getByCategory(cat: string): Observable<Event[]> {
    return this.getAll({ categoria: cat });
  }

  getCategories(): string[] {
    return ['Todos los eventos', 'Deportivos', 'Torneos', 'Sociales', 'Institucionales'];
  }

  crear(payload: FormData | any): Observable<{ message: string; id?: number }> {
    return this.http.post<{ message: string; id?: number }>(this.apiUrl, payload);
  }

  actualizar(id: number, payload: FormData | any): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}`, payload);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
