import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Sport {
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
  athletes: number;
  atletas?: number;
  coaches: number;
  entrenadores?: number;
  schedule: string;
  horario?: string;
  features: string[];
  caracteristicas?: string[];
  categories: string[];
  categorias?: string[];
  technicalSpecs: { key: string; value: string }[];
  especificaciones_tecnicas?: { key: string; value: string }[];
  equipment: string[];
  equipamiento?: string[];
  regulations: string[];
  normativas?: string[];
  tipo?: string;
  label?: string;
  capacidad?: number;
  activo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SportsService {
  private readonly apiUrl = `${environment.apiUrl}/deportes`;

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

  private parseSpecs(val: any): { key: string; value: string }[] {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map(item => {
        if (typeof item === 'object' && item !== null && item.key) return item;
        const str = String(item).trim();
        const colonIdx = str.indexOf(':');
        if (colonIdx !== -1) {
          return { key: str.slice(0, colonIdx).trim(), value: str.slice(colonIdx + 1).trim() };
        }
        return { key: 'Detalle', value: str };
      }).filter(s => s.key || s.value);
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          return this.parseSpecs(JSON.parse(trimmed));
        } catch {}
      }
      return trimmed
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(line => {
          const colonIdx = line.indexOf(':');
          if (colonIdx !== -1) {
            return { key: line.slice(0, colonIdx).trim(), value: line.slice(colonIdx + 1).trim() };
          }
          return { key: 'Detalle', value: line };
        });
    }
    return [];
  }

  private mapSport(item: any): Sport {
    const rawFeatures = Array.isArray(item.features)
      ? item.features
      : (Array.isArray(item.caracteristicas)
          ? item.caracteristicas
          : this.parseJson(item.caracteristicas, []));

    const rawCategories = Array.isArray(item.categories)
      ? item.categories
      : (Array.isArray(item.categorias)
          ? item.categorias
          : this.parseJson(item.categorias, []));

    const rawSpecs = Array.isArray(item.technicalSpecs)
      ? item.technicalSpecs
      : (Array.isArray(item.especificaciones_tecnicas)
          ? item.especificaciones_tecnicas
          : this.parseSpecs(item.especificaciones_tecnicas));

    const rawEquipment = Array.isArray(item.equipment)
      ? item.equipment
      : (Array.isArray(item.equipamiento)
          ? item.equipamiento
          : this.parseJson(item.equipamiento, []));

    const rawRegulations = Array.isArray(item.regulations)
      ? item.regulations
      : (Array.isArray(item.normativas)
          ? item.normativas
          : this.parseJson(item.normativas, []));

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
      icon: item.icon || item.icono || 'fa-futbol',
      icono: item.icono || item.icon || 'fa-futbol',
      athletes: Number(item.athletes ?? item.atletas ?? item.atletas_count ?? 0),
      atletas: Number(item.atletas ?? item.athletes ?? item.atletas_count ?? 0),
      coaches: Number(item.coaches ?? item.entrenadores ?? item.entrenadores_count ?? 0),
      entrenadores: Number(item.entrenadores ?? item.coaches ?? item.entrenadores_count ?? 0),
      schedule: item.schedule || item.horario || '',
      horario: item.horario || item.schedule || '',
      tipo: item.tipo || item.label || 'Deportes',
      label: item.label || item.tipo || 'Deportes',
      capacidad: Number(item.capacidad ?? 0),
      features: rawFeatures,
      caracteristicas: rawFeatures,
      categories: rawCategories,
      categorias: rawCategories,
      technicalSpecs: rawSpecs,
      especificaciones_tecnicas: rawSpecs,
      equipment: rawEquipment,
      equipamiento: rawEquipment,
      regulations: rawRegulations,
      normativas: rawRegulations,
      activo: item.activo !== false
    };
  }

  getAll(): Observable<Sport[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        return list.map((item: any) => this.mapSport(item));
      })
    );
  }

  getById(id: number): Observable<Sport> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(res => this.mapSport(res?.data || res))
    );
  }

  search(query: string): Observable<Sport[]> {
    const q = (query || '').trim().toLowerCase();
    return this.getAll().pipe(
      map(sports =>
        sports.filter(s =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
        )
      )
    );
  }

  getStats() {
    return { disciplines: 8, athletes: 300, coaches: 45, members: 1500 };
  }
}
