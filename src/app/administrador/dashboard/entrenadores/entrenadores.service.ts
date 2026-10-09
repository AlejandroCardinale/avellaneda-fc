import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Entrenador {
  id: number;
  usuario_id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  deporte?: string;
  deporte_id?: number;
  especialidad?: string;
  licencia?: string | null;
  fecha_ingreso?: string | null;
  estado: 'activo' | 'inactivo';
}

export interface EntrenadorPayload {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  deporte_id: number;
  especialidad: string;
  licencia?: string | null;
  estado_inicial: 'activo' | 'inactivo';
}

export interface AtletaAsignado {
  id: number;
  usuario_id: number;
  entrenador_id?: number | null;
  nombre: string;
  apellido: string;
  email: string;
  avatar_url?: string | null;
  telefono?: string | null;
  dni?: string | null;
  deporte_id?: number;
  deporte?: string;
  estado: 'activo' | 'inactivo' | string;
}

export interface EntrenadorResponse {
  message: string;
  entrenadorId?: number;
  usuarioId?: number;
}

@Injectable({ providedIn: 'root' })
export class EntrenadoresService {
  private readonly API = `${environment.apiUrl}/entrenadores`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Entrenador[]> {
    return this.http.get<Entrenador[]>(this.API);
  }

  obtenerPorId(id: number): Observable<Entrenador> {
    return this.http.get<Entrenador>(`${this.API}/${id}`);
  }

  listarAtletas(id: number): Observable<AtletaAsignado[]> {
    return this.http.get<AtletaAsignado[]>(`${this.API}/${id}/atletas`);
  }

  listarAtletasDisponibles(id: number): Observable<AtletaAsignado[]> {
    return this.http.get<AtletaAsignado[]>(`${this.API}/${id}/atletas-disponibles`);
  }

  asignarAtleta(atletaId: number, entrenadorId: number | null): Observable<{ message: string; atletaId: number; entrenadorId: number | null }> {
    return this.http.put<{ message: string; atletaId: number; entrenadorId: number | null }>(
      `${environment.apiUrl}/atletas/${atletaId}/asignar-entrenador`,
      { entrenador_id: entrenadorId }
    );
  }

  registrar(payload: EntrenadorPayload): Observable<EntrenadorResponse> {
    return this.http.post<EntrenadorResponse>(this.API, payload);
  }

  actualizar(id: number, payload: EntrenadorPayload): Observable<EntrenadorResponse> {
    return this.http.put<EntrenadorResponse>(`${this.API}/${id}`, payload);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API}/${id}`);
  }
}
