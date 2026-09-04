import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardSummary {
  totalAtletas: number;
  totalEntrenadores: number;
  solicitudesPendientes: number;
  recursosDisponibles: number;
}

export interface DashboardNotice {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  fecha: string;
}

export interface DashboardSolicitud {
  id: number;
  tipo: string;
  estado: string;
  fecha: string;
  solicitante: string;
  creado: string;
}

export interface DashboardActivityItem {
  tipo: string;
  texto: string;
  minutos_antes: number;
}

export interface DashboardChartItem {
  mes: string;
  total: number;
}

export interface AdminDashboardResponse {
  summary: DashboardSummary;
  noticias: DashboardNotice[];
  solicitudes: DashboardSolicitud[];
  actividad: DashboardActivityItem[];
  chart: DashboardChartItem[];
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly API = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<AdminDashboardResponse> {
    return this.http.get<AdminDashboardResponse>(`${this.API}/dashboard`);
  }
}
