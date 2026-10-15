import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AtletaPerfil {
  id: number;
  usuario_id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  dni?: string;
  fecha_nacimiento?: string | null;
  fecha_alta?: string;
  posicion?: string | null;
  estado_medico: string;
  observaciones?: string | null;
  deporte?: string;
  categoria?: string;
  entrenador_nombre?: string | null;
}

export interface EntrenamientoAtleta {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha_hora: string;
  duracion_min: number;
  estado: 'programada' | 'en_curso' | 'finalizada' | 'cancelada';
  categoria?: string | null;
  instalacion?: string | null;
  entrenador?: string | null;
  presente: boolean | null;
  observacion?: string;
}

export interface RegistroAsistencia {
  sesion_id: number;
  titulo: string;
  fecha_hora: string;
  estado: string;
  presente: boolean | null;
  observacion: string;
}

export interface ResumenAsistencias {
  totalSesiones: number;
  presentes: number;
  ausencias: number;
  justificadas: number;
  injustificadas: number;
  porcentajeAsistencia: number;
  registros: RegistroAsistencia[];
}

export interface ActualizarPerfilPayload {
  nombre: string;
  apellido: string;
  telefono?: string;
  password_actual?: string;
  password_nueva?: string;
}

@Injectable({ providedIn: 'root' })
export class AtletaService {
  private readonly API = `${environment.apiUrl}/atleta`;

  constructor(private http: HttpClient) {}

  getPerfil(): Observable<AtletaPerfil> {
    return this.http.get<AtletaPerfil>(`${this.API}/perfil`);
  }

  actualizarPerfil(payload: ActualizarPerfilPayload): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/perfil`, payload);
  }

  getEntrenamientos(): Observable<EntrenamientoAtleta[]> {
    return this.http.get<EntrenamientoAtleta[]>(`${this.API}/entrenamientos`);
  }

  getAsistencias(): Observable<ResumenAsistencias> {
    return this.http.get<ResumenAsistencias>(`${this.API}/asistencias`);
  }
}
