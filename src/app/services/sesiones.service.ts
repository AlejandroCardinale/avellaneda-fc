import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Sesion {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha_hora: string;
  duracion_min: number;
  estado: 'programada' | 'en_curso' | 'finalizada' | 'cancelada';
  entrenador: string;
  deporte: string;
  categoria?: string;
  instalacion?: string;
}

export interface Asistencia {
  sesion_id: number;
  atleta_id: number;
  presente: boolean;
  observacion?: string;
}

export interface Reserva {
  id: number;
  instalacion_id: number;
  instalacion: string;
  usuario_id: number;
  fecha_hora_ini: string;
  fecha_hora_fin: string;
  motivo?: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
}

@Injectable({ providedIn: 'root' })
export class SesionesService {
  private readonly BASE = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /* ─── Sesiones ─── */
  getSesiones(params?: { entrenador_id?: number; deporte_id?: number; estado?: string }): Observable<Sesion[]> {
    let p = new HttpParams();
    if (params?.entrenador_id) p = p.set('entrenador_id', params.entrenador_id);
    if (params?.deporte_id)    p = p.set('deporte_id',    params.deporte_id);
    if (params?.estado)        p = p.set('estado',        params.estado);
    return this.http.get<Sesion[]>(`${this.BASE}/sesiones`, { params: p });
  }

  getSesionById(id: number): Observable<Sesion> {
    return this.http.get<Sesion>(`${this.BASE}/sesiones/${id}`);
  }

  crearSesion(data: Partial<Sesion>): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.BASE}/sesiones`, data);
  }

  actualizarSesion(id: number, data: Partial<Sesion>): Observable<Sesion> {
    return this.http.put<Sesion>(`${this.BASE}/sesiones/${id}`, data);
  }

  cancelarSesion(id: number): Observable<Sesion> {
    return this.http.patch<Sesion>(`${this.BASE}/sesiones/${id}/estado`, { estado: 'cancelada' });
  }

  /* ─── Asistencias ─── */
  getAsistencias(sesionId: number): Observable<Asistencia[]> {
    return this.http.get<Asistencia[]>(`${this.BASE}/sesiones/${sesionId}/asistencias`);
  }

  registrarAsistencias(sesionId: number, asistencias: Asistencia[]): Observable<void> {
    return this.http.post<void>(`${this.BASE}/sesiones/${sesionId}/asistencias`, asistencias);
  }

  /* ─── Reservas ─── */
  getReservas(params?: { instalacion_id?: number; usuario_id?: number; estado?: string }): Observable<Reserva[]> {
    let p = new HttpParams();
    if (params?.instalacion_id) p = p.set('instalacion_id', params.instalacion_id);
    if (params?.usuario_id)     p = p.set('usuario_id',     params.usuario_id);
    if (params?.estado)         p = p.set('estado',         params.estado);
    return this.http.get<Reserva[]>(`${this.BASE}/reservas`, { params: p });
  }

  crearReserva(data: Partial<Reserva>): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.BASE}/reservas`, data);
  }

  actualizarReserva(id: number, estado: Reserva['estado']): Observable<Reserva> {
    return this.http.patch<Reserva>(`${this.BASE}/reservas/${id}`, { estado });
  }
}
