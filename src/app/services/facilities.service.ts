import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Facility {
  id: number;
  name: string;
  nombre?: string;
  description: string;
  descripcion?: string;
  longDescription: string;
  descripcion_larga?: string;
  image: string;
  imagen_url?: string;
  icon: string;
  icono?: string;
  label: string;
  tipo?: string;
  capacidad?: number;
  features: string[];
  caracteristicas?: string[];
  technicalSpecs: { key: string; value: string }[];
  especificaciones_tecnicas?: { key: string; value: string }[];
  schedule: string;
  horario?: string;
  regulations: string[];
  normativas?: string[];
  equipment: string[];
  equipamiento?: string[];
  activa?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FacilitiesService {
  private readonly apiUrl = `${environment.apiUrl}/instalaciones`;

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

  private mapFacility(item: any): Facility {
    return {
      id: Number(item.id),
      name: item.name || item.nombre || '',
      nombre: item.nombre || item.name || '',
      description: item.description || item.descripcion || '',
      descripcion: item.descripcion || item.description || '',
      longDescription: item.longDescription || item.descripcion_larga || item.descripcion || item.description || '',
      descripcion_larga: item.descripcion_larga || item.longDescription || item.descripcion || '',
      image: item.image || item.imagen_url || 'images/football_pitch.png',
      imagen_url: item.imagen_url || item.image || 'images/football_pitch.png',
      icon: item.icon || item.icono || 'fa-building',
      icono: item.icono || item.icon || 'fa-building',
      label: item.label || item.tipo || 'Deportiva',
      tipo: item.tipo || item.label || 'Deportiva',
      capacidad: Number(item.capacidad ?? 0),
      schedule: item.schedule || item.horario || '',
      horario: item.horario || item.schedule || '',
      features: Array.isArray(item.features)
        ? item.features
        : (Array.isArray(item.caracteristicas)
            ? item.caracteristicas
            : this.parseJson(item.caracteristicas, [])),
      caracteristicas: Array.isArray(item.caracteristicas)
        ? item.caracteristicas
        : (Array.isArray(item.features)
            ? item.features
            : this.parseJson(item.features, [])),
      technicalSpecs: Array.isArray(item.technicalSpecs)
        ? item.technicalSpecs
        : (Array.isArray(item.especificaciones_tecnicas)
            ? item.especificaciones_tecnicas
            : this.parseJson(item.especificaciones_tecnicas, [])),
      especificaciones_tecnicas: Array.isArray(item.especificaciones_tecnicas)
        ? item.especificaciones_tecnicas
        : (Array.isArray(item.technicalSpecs)
            ? item.technicalSpecs
            : this.parseJson(item.technicalSpecs, [])),
      regulations: Array.isArray(item.regulations)
        ? item.regulations
        : (Array.isArray(item.normativas)
            ? item.normativas
            : this.parseJson(item.normativas, [])),
      normativas: Array.isArray(item.normativas)
        ? item.normativas
        : (Array.isArray(item.regulations)
            ? item.regulations
            : this.parseJson(item.regulations, [])),
      equipment: Array.isArray(item.equipment)
        ? item.equipment
        : (Array.isArray(item.equipamiento)
            ? item.equipamiento
            : this.parseJson(item.equipamiento, [])),
      equipamiento: Array.isArray(item.equipamiento)
        ? item.equipamiento
        : (Array.isArray(item.equipment)
            ? item.equipment
            : this.parseJson(item.equipment, [])),
      activa: item.activa !== false
    };
  }

  getAll(): Observable<Facility[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        return list.map((item: any) => this.mapFacility(item));
      })
    );
  }

  getById(id: number): Observable<Facility> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => this.mapFacility(res?.data || res))
    );
  }

  listar(search = '', tipo = '', activa = 'todos'): Observable<Facility[]> {
    let params = new HttpParams();
    if (search.trim()) params = params.set('search', search.trim());
    if (tipo && tipo !== 'todas') params = params.set('tipo', tipo);
    if (activa) params = params.set('activa', activa);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        return list.map((item: any) => this.mapFacility(item));
      })
    );
  }

  crear(payload: FormData): Observable<{ message: string; id?: number }> {
    return this.http.post<{ message: string; id?: number }>(this.apiUrl, payload);
  }

  actualizar(id: number, payload: FormData): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}`, payload);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

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
