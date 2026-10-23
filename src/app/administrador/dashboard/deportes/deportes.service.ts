import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Deporte {
  id: number;
  nombre: string;
  name?: string;
  descripcion: string;
  description?: string;
  descripcion_larga?: string;
  longDescription?: string;
  categoria: string | null;
  tipo?: string;
  label?: string;
  capacidad?: number;
  icono: string;
  icon?: string;
  imagen_url: string | null;
  image?: string;
  activo: boolean;
  atletas: number;
  atletas_count?: number;
  entrenadores: number;
  entrenadores_count?: number;
  horario?: string;
  schedule?: string;
  caracteristicas?: string[];
  features?: string[];
  categorias?: string[];
  categories?: string[];
  especificaciones_tecnicas?: { key: string; value: string }[];
  technicalSpecs?: { key: string; value: string }[];
  equipamiento?: string[];
  equipment?: string[];
  normativas?: string[];
  regulations?: string[];
}

export interface DeportesResponse {
  data: Deporte[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class DeportesAdminService {
  private readonly api = `${environment.apiUrl}/deportes`;

  constructor(private http: HttpClient) {}

  listar(search: string, activo: string): Observable<DeportesResponse> {
    const params = new HttpParams().set('search', search).set('activo', activo);
    return this.http.get<DeportesResponse>(this.api, { params });
  }

  crear(payload: FormData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.api, payload);
  }

  actualizar(id: number, payload: FormData): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/${id}`, payload);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/${id}`);
  }
}
