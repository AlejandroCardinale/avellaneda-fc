/**
 * ============================================================
 * AUTH SERVICE — Servicio de Autenticación
 * ============================================================
 * Este servicio centraliza TODA la lógica de sesión del usuario.
 * Cualquier componente que necesite saber si hay un usuario logueado,
 * cuál es su rol, o hacer login/logout, debe inyectar este servicio.
 *
 * ALMACENAMIENTO:
 *   Los datos de sesión se guardan en localStorage del navegador:
 *   - 'access_token'  → JWT de corta duración (1 hora). Se envía en cada
 *                        petición HTTP mediante el AuthInterceptor.
 *   - 'refresh_token' → JWT de larga duración (7 días). Se usa para
 *                        obtener un nuevo access_token sin pedir contraseña.
 *   - 'usuario'       → Objeto JSON con id, nombre, email y rol.
 * ============================================================
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

/** Estructura del cuerpo que se envía al hacer login */
export interface LoginRequest    { email: string; password: string; }

/** Estructura del cuerpo que se envía al registrarse */
export interface RegisterRequest {
  nombre: string; apellido: string;
  email: string; password: string;
  telefono?: string;
  rol?: string;   // 'atleta' | 'entrenador' | 'administrador'
}

/** Estructura de la respuesta del backend al autenticar exitosamente */
export interface AuthResponse  {
  access_token: string;
  refresh_token: string;
  usuario: {
    id: number; nombre: string; apellido: string;
    email: string; rol: 'administrador' | 'entrenador' | 'atleta';
    avatar_url?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** URL base del endpoint de autenticación, definida en environment.ts */
  private readonly API = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  /**
   * Inicia sesión con email y contraseña.
   * Si el backend responde OK, guarda los tokens y datos del usuario en localStorage.
   * El componente de login se suscribe a este Observable para redirigir al usuario.
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('access_token',  res.access_token);
        localStorage.setItem('refresh_token', res.refresh_token);
        localStorage.setItem('usuario',       JSON.stringify(res.usuario));
      })
    );
  }

  /**
   * Registra un nuevo usuario.
   * Ahora el backend devuelve { message, pendiente: true } — NO tokens.
   * La cuenta queda pendiente hasta aprobación del admin.
   */
  register(data: RegisterRequest): Observable<{ message: string; pendiente: boolean }> {
    return this.http.post<{ message: string; pendiente: boolean }>(`${this.API}/register`, data);
    // No se guardan tokens — el usuario no inicia sesión automáticamente
  }

  /**
   * Cierra la sesión del usuario.
   * Limpia localStorage inmediatamente (no espera al backend).
   * Si el backend falla (p.ej. no está corriendo), igual cierra sesión local.
   */
  logout(): Observable<void> {
    this.clearSession();   // limpiar ANTES de la petición → el usuario queda deslogueado
    return this.http.post<void>(`${this.API}/logout`, {});
  }

  /**
   * Renueva el access_token usando el refresh_token guardado.
   * Se llama automáticamente desde el AuthInterceptor cuando el backend
   * devuelve un error 401 (token expirado).
   */
  refreshToken(): Observable<{ access_token: string }> {
    const token = localStorage.getItem('refresh_token');
    return this.http.post<{ access_token: string }>(`${this.API}/refresh`, { token }).pipe(
      tap(res => localStorage.setItem('access_token', res.access_token))
    );
  }

  /** Devuelve el access_token actual o null si no hay sesión */
  getToken(): string | null       { return localStorage.getItem('access_token'); }

  /** Devuelve true si hay un token guardado (usuario logueado) */
  isLoggedIn(): boolean           { return !!this.getToken(); }

  /** Devuelve el objeto de usuario guardado en localStorage */
  getUsuario(): AuthResponse['usuario'] | null {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
  }

  /** Devuelve el rol del usuario actual: 'administrador', 'entrenador' o 'atleta' */
  getRol(): string | null         { return this.getUsuario()?.rol ?? null; }

  /** Atajos de verificación de rol para usar en templates y guards */
  isAdmin(): boolean              { return this.getRol() === 'administrador'; }
  isEntrenador(): boolean         { return this.getRol() === 'entrenador'; }
  isAtleta(): boolean             { return this.getRol() === 'atleta'; }

  /**
   * Elimina todos los datos de sesión del localStorage.
   * Se llama al hacer logout o cuando el refresh_token también expira.
   */
  private clearSession(): void {
    ['access_token','refresh_token','usuario'].forEach(k => localStorage.removeItem(k));
  }
}
