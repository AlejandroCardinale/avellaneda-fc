/**
 * ============================================================
 * SOLICITUDES SERVICE — Servicio de Solicitudes
 * ============================================================
 * Comunica el frontend Angular con los endpoints del backend
 * relacionados al módulo de solicitudes.
 *
 * Todas las peticiones de este servicio llevan el JWT adjunto
 * automáticamente gracias al AuthInterceptor.
 * ============================================================
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Representa un ítem del catálogo de productos (tabla catalogo_items en BD) */
export interface CatalogoItem {
  id: number;
  categoria: 'indumentaria' | 'equipamiento' | 'transporte';
  nombre: string;
  descripcion: string;
  icono: string;
  requiere_talle: boolean;
  requiere_numero: boolean;
}

/**
 * Representa un ítem dentro de una solicitud.
 * El campo 'nombre' es texto libre (ej: "Camiseta de juego").
 * Los campos talle y numero_dorsal solo aplican a indumentaria.
 */
export interface SolicitudItem {
  item_id?: number;       // Opcional: referencia al catálogo (no requerida actualmente)
  nombre: string;         // Nombre libre del ítem solicitado
  cantidad: number;
  talle?: string;         // Solo indumentaria: XS, S, M, L, XL, XXL
  numero_dorsal?: number; // Solo camisetas: número del dorsal (1-99)
  observacion?: string;
}

/**
 * Estructura completa que se envía al backend al crear una solicitud.
 * El backend guarda esto en las tablas 'solicitudes' y 'solicitud_items'.
 */
export interface SolicitudPayload {
  tipo: 'indumentaria' | 'equipamiento' | 'transporte';
  fecha_necesidad: string;  // Formato: YYYY-MM-DD
  destino?: string;         // Solo transporte
  pasajeros?: number;       // Solo transporte
  observaciones?: string;
  items: SolicitudItem[];
}

/** Estructura de una solicitud existente (para mostrar en el historial) */
export interface Solicitud {
  id: number;
  tipo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'entregada';
  fecha_necesidad: string;
  destino?: string;
  pasajeros?: number;
  observaciones?: string;
  creado_en: string;
  items: any[];
}

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  /** URL base de la API, definida en environment.ts → http://localhost:3000/api */
  private readonly API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el catálogo de ítems disponibles desde la BD.
   * Parámetro opcional 'categoria' filtra por tipo.
   * Endpoint: GET /api/catalogo
   */
  getCatalogo(categoria?: string): Observable<CatalogoItem[]> {
    const url = categoria
      ? `${this.API}/catalogo?categoria=${categoria}`
      : `${this.API}/catalogo`;
    return this.http.get<CatalogoItem[]>(url);
  }

  /**
   * Envía una nueva solicitud al backend.
   * El backend la guarda en una transacción SQL que garantiza
   * que se graben tanto la cabecera como todos los ítems,
   * o ninguno si hay un error.
   * Endpoint: POST /api/solicitudes
   */
  crearSolicitud(payload: SolicitudPayload): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(`${this.API}/solicitudes`, payload);
  }

  /**
   * Devuelve todas las solicitudes del usuario actualmente logueado,
   * incluyendo los ítems de cada una.
   * Endpoint: GET /api/solicitudes/mias
   */
  getMisSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.API}/solicitudes/mias`);
  }
}
