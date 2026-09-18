import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type RecursoCategoria = 'equipamiento' | 'indumentaria' | 'transporte';
export type RecursoEstado = 'disponible' | 'mantenimiento' | 'stock_bajo';

export interface RecursoDeportivo {
  id: number;
  categoria: RecursoCategoria;
  nombre: string;
  descripcion: string | null;
  icono: string;
  requiere_talle: boolean;
  requiere_numero: boolean;
  cantidad_disponible: number;
  estado: RecursoEstado;
  activo: boolean;
}

export interface RecursoPayload {
  nombre: string;
  categoria: RecursoCategoria;
  descripcion: string;
  icono: string;
  requiere_talle: boolean;
  requiere_numero: boolean;
  cantidad_disponible: number;
  estado: RecursoEstado;
  activo: boolean;
}

export interface SolicitudAdmin {
  id: number;
  tipo: RecursoCategoria;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'entregada';
  fecha_necesidad: string;
  creado_en: string;
  solicitante: string;
  email: string;
  total_items: number;
}

export interface RecursosResponse {
  data: RecursoDeportivo[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  metrics: {
    total: number;
    equipamiento: number;
    indumentaria: number;
    transporte: number;
  };
}

@Injectable({ providedIn: 'root' })
export class RecursosDeportivosService {
  private readonly api = `${environment.apiUrl}/recursos`;

  constructor(private http: HttpClient) {}

  listar(filters: { search: string; categoria: string; page: number; pageSize: number }): Observable<RecursosResponse> {
    const params = new HttpParams()
      .set('search', filters.search)
      .set('categoria', filters.categoria)
      .set('page', filters.page)
      .set('pageSize', filters.pageSize);
    return this.http.get<RecursosResponse>(this.api, { params });
  }

  actualizar(id: number, payload: Pick<RecursoDeportivo, 'cantidad_disponible' | 'estado'>): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.api}/${id}`, payload);
  }

  crear(payload: RecursoPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.api, payload);
  }

  actualizarCompleto(id: number, payload: RecursoPayload): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/${id}`, payload);
  }

  listarSolicitudes(): Observable<SolicitudAdmin[]> {
    return this.http.get<SolicitudAdmin[]>(`${this.api.replace('/recursos', '/solicitudes')}`);
  }

  actualizarEstadoSolicitud(id: number, estado: SolicitudAdmin['estado']): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.api.replace('/recursos', '/solicitudes')}/${id}/estado`, { estado });
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/${id}`);
  }
}
