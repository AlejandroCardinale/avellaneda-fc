import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Usuario {
  id: number;
  rol_id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  avatar_url?: string;
  activo: boolean;
  rol: string;
  creado_en: string;
  ultimo_login?: string;
}

export interface Atleta {
  id: number;
  usuario_id: number;
  nombre: string;
  apellido: string;
  email: string;
  deporte: string;
  categoria?: string;
  numero_socio?: string;
  posicion?: string;
  estado_medico: 'apto' | 'no_apto' | 'pendiente';
  fecha_nacimiento?: string;
  dni?: string;
}

export interface Entrenador {
  id: number;
  usuario_id: number;
  nombre: string;
  apellido: string;
  email: string;
  deporte: string;
  especialidad?: string;
  licencia?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly API = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  /* ─── Usuarios ─── */
  getAll(params?: { rol?: string; activo?: boolean }): Observable<Usuario[]> {
    let p = new HttpParams();
    if (params?.rol    !== undefined) p = p.set('rol',    params.rol);
    if (params?.activo !== undefined) p = p.set('activo', String(params.activo));
    return this.http.get<Usuario[]>(this.API, { params: p });
  }

  getById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.API}/${id}`);
  }

  update(id: number, data: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.API}/${id}`, data);
  }

  toggleActivo(id: number, activo: boolean): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.API}/${id}/activo`, { activo });
  }

  /* ─── Atletas ─── */
  getAtletas(deporteId?: number): Observable<Atleta[]> {
    let p = new HttpParams();
    if (deporteId) p = p.set('deporte_id', deporteId);
    return this.http.get<Atleta[]>(`${environment.apiUrl}/atletas`, { params: p });
  }

  getAtletaById(id: number): Observable<Atleta> {
    return this.http.get<Atleta>(`${environment.apiUrl}/atletas/${id}`);
  }

  updateAtleta(id: number, data: Partial<Atleta>): Observable<Atleta> {
    return this.http.put<Atleta>(`${environment.apiUrl}/atletas/${id}`, data);
  }

  /* ─── Entrenadores ─── */
  getEntrenadores(deporteId?: number): Observable<Entrenador[]> {
    let p = new HttpParams();
    if (deporteId) p = p.set('deporte_id', deporteId);
    return this.http.get<Entrenador[]>(`${environment.apiUrl}/entrenadores`, { params: p });
  }

  getEntrenadorById(id: number): Observable<Entrenador> {
    return this.http.get<Entrenador>(`${environment.apiUrl}/entrenadores/${id}`);
  }
}
