/**
 * ============================================================
 * AUTH INTERCEPTOR — Interceptor HTTP de Autenticación
 * ============================================================
 * Angular ejecuta este interceptor de forma AUTOMÁTICA antes de
 * enviar CUALQUIER petición HTTP al backend.
 *
 * ¿Qué hace?
 * 1. Lee el access_token del AuthService (localStorage).
 * 2. Si existe, lo agrega al header "Authorization: Bearer <token>"
 *    antes de que la petición salga hacia el servidor.
 * 3. Si el servidor responde con error 401 (token expirado):
 *    a. Intenta renovar el token llamando a /api/auth/refresh.
 *    b. Si la renovación funciona, reenvía la petición original
 *       con el nuevo token.
 *    c. Si la renovación también falla (refresh_token expirado),
 *       redirige al usuario a la pantalla de login.
 *
 * Está registrado en app.config.ts con withInterceptors([authInterceptor]).
 * ============================================================
 */
import { Injectable } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const token  = auth.getToken(); // Lee el token actual del localStorage

  /**
   * Clona la petición original agregándole el header de autorización.
   * Si no hay token (usuario no logueado), pasa la petición sin modificar.
   * Se clona porque las peticiones HTTP son inmutables en Angular.
   */
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      /**
       * Si el servidor responde 401 y NO es una petición de auth
       * (evitamos bucle infinito en /login, /register, /refresh):
       */
      if (err.status === 401 && !req.url.includes('/auth/')) {
        // Intenta renovar el access_token con el refresh_token
        return auth.refreshToken().pipe(
          switchMap(res => {
            // Reenvía la petición original con el nuevo token
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.access_token}` }
            });
            return next(retryReq);
          }),
          catchError(() => {
            // El refresh_token también expiró → llevar al login
            router.navigate(['/login']);
            return throwError(() => err);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
