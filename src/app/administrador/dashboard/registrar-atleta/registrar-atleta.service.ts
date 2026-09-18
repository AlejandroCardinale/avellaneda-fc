import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface RegistrarAtletaRequest {
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  telefono?: string;
  direccion?: string;
  genero?: string;
  fecha_nacimiento: string;
  dni: string;
  deporte_id: number;
  categoria_id?: number | null;
  fecha_inscripcion: string;
  estado_inicial?: 'activo' | 'inactivo' | 'pendiente';
}

export interface RegistrarAtletaResponse {
  message: string;
  usuarioId?: number;
  atletaId?: number;
}

export interface ActualizarAtletaResponse {
  message: string;
}

export interface AtletaListado {
  id: number;
  usuario_id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  dni?: string;
  fecha_nacimiento?: string;
  fecha_inscripcion?: string;
  genero?: string;
  direccion?: string;
  deporte_id?: number;
  categoria_id?: number;
  deporte?: string;
  categoria?: string;
  estado?: string;
  observaciones?: string | null;
}

@Injectable({ providedIn: 'root' })
export class RegistrarAtletaService {
  private readonly API = `${environment.apiUrl}/atletas`;

  constructor(private http: HttpClient) {}

  getAtletas(): Observable<AtletaListado[]> {
    return this.http.get<AtletaListado[]>(this.API);
  }

  registrar(payload: RegistrarAtletaRequest): Observable<RegistrarAtletaResponse> {
    return this.http.post<RegistrarAtletaResponse>(this.API, payload);
  }

  actualizar(id: number, payload: Partial<RegistrarAtletaRequest>): Observable<ActualizarAtletaResponse> {
    return this.http.put<ActualizarAtletaResponse>(`${this.API}/${id}`, payload);
  }

  deleteAtleta(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API}/${id}`);
  }
}
