import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EntrenadorPerfil {
  id: number;
  usuario_id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  deporte_id: number;
  deporte: string;
  especialidad?: string;
  licencia?: string;
  fecha_ingreso?: string;
}

export interface EntrenadorDashboard {
  entrenador: EntrenadorPerfil;
  resumen: { atletas: number; sesiones: number; proximas: number };
  proximosEntrenamientos: Entrenamiento[];
}

export interface AtletaEntrenador {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  categoria?: string;
  fecha_alta?: string;
  estado_medico: string;
}

export interface Entrenamiento {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha_hora: string;
  duracion_min: number;
  estado: 'programada' | 'en_curso' | 'finalizada' | 'cancelada';
  categoria_id?: number | null;
  categoria?: string | null;
  instalacion_id?: number | null;
  instalacion?: string | null;
  total_atletas?: number;
  presentes?: number;
}

export interface EntrenamientoPayload {
  titulo: string;
  descripcion: string;
  fecha_hora: string;
  duracion_min: number;
  categoria_id: number | null;
  instalacion_id: number | null;
}

export interface ListaAsistencia {
  atleta_id: number;
  nombre: string;
  apellido: string;
  categoria?: string;
  presente: boolean | number;
  observacion: string;
}

@Injectable({ providedIn: 'root' })
export class EntrenadorService {
  private readonly API = `${environment.apiUrl}/entrenador`;

  constructor(private http: HttpClient) {}

  dashboard(): Observable<EntrenadorDashboard> {
    return this.http.get<EntrenadorDashboard>(`${this.API}/dashboard`);
  }

  listarAtletas(): Observable<AtletaEntrenador[]> {
    return this.http.get<AtletaEntrenador[]>(`${this.API}/atletas`);
  }

  catalogos(): Observable<{ categorias: { id: number; nombre: string }[]; instalaciones: { id: number; nombre: string }[] }> {
    return this.http.get<{ categorias: { id: number; nombre: string }[]; instalaciones: { id: number; nombre: string }[] }>(`${this.API}/catalogos`);
  }

  listarSesiones(): Observable<Entrenamiento[]> {
    return this.http.get<Entrenamiento[]>(`${this.API}/sesiones`);
  }

  crearSesion(payload: EntrenamientoPayload): Observable<{ message: string; id: number }> {
    return this.http.post<{ message: string; id: number }>(`${this.API}/sesiones`, payload);
  }

  actualizarSesion(id: number, payload: EntrenamientoPayload): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/sesiones/${id}`, payload);
  }

  cambiarEstadoSesion(id: number, estado: Entrenamiento['estado']): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.API}/sesiones/${id}/estado`, { estado });
  }

  obtenerAsistencia(id: number): Observable<ListaAsistencia[]> {
    return this.http.get<ListaAsistencia[]>(`${this.API}/sesiones/${id}/asistencias`);
  }

  guardarAsistencia(id: number, asistencias: { atleta_id: number; presente: boolean; observacion: string }[]): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/sesiones/${id}/asistencias`, { asistencias });
  }
}