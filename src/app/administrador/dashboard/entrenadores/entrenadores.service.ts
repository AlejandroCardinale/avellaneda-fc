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
