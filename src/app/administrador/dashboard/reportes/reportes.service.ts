import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ReportFilters { desde: string; hasta: string; disciplina: string; }
export interface ReportResponse {
  filters: ReportFilters;
  metrics: { totalAtletas: number; promedioAsistencia: number; recursosEnUso: number; solicitudesResueltas: number };
  atletasPorDisciplina: { id: number; nombre: string; total: number }[];
  recursosMasSolicitados: { nombre: string; total: number }[];
  asistenciaSemanal: { semana: number; porcentaje: number }[];
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly api = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  obtener(filters: ReportFilters): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(this.api, { params: this.params(filters) });
  }

  exportar(filters: ReportFilters, formato: 'excel' | 'pdf'): Observable<Blob> {
    return this.http.get(`${this.api}/export`, { params: this.params(filters).set('formato', formato), responseType: 'blob' });
  }

  private params(filters: ReportFilters): HttpParams {
    return new HttpParams().set('desde', filters.desde).set('hasta', filters.hasta).set('disciplina', filters.disciplina);
  }
}
