import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type NoticiaEstado = 'publicada' | 'borrador' | 'programada';

export interface Noticia {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  imagen_url: string | null;
  destacada: boolean;
  publicada: boolean;
  estado: NoticiaEstado;
  fecha_publicacion: string;
}

export interface NoticiaPayload {
  titulo: string;
  descripcion: string;
  categoria: string;
  imagen_url: string;
  estado: NoticiaEstado;
  fecha_publicacion: string | null;
}

export interface NoticiasResponse {
  data: Noticia[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  metrics: { publicadas: number; borradores: number; programadas: number };
}

@Injectable({ providedIn: 'root' })
export class GestionNoticiasService {
  private readonly api = `${environment.apiUrl}/noticias`;

  constructor(private http: HttpClient) {}

  listar(filters: { search: string; status: string; page: number; pageSize: number; order: string }): Observable<NoticiasResponse> {
    const params = new HttpParams()
      .set('search', filters.search)
      .set('status', filters.status)
      .set('page', filters.page)
      .set('pageSize', filters.pageSize)
      .set('order', filters.order);
    return this.http.get<NoticiasResponse>(this.api, { params });
  }

  crear(payload: NoticiaPayload | FormData): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.api, payload);
  }

  actualizar(id: number, payload: NoticiaPayload | FormData): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/${id}`, payload);
  }

  eliminar(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/${id}`);
  }
}
