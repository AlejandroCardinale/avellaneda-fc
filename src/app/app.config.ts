/**
 * ============================================================
 * APP.CONFIG.TS — Configuración Global de la Aplicación Angular
 * ============================================================
 * Este archivo es el punto de arranque de la configuración de Angular.
 * Es equivalente al antiguo "AppModule" pero en estilo moderno (standalone).
 * Define los providers (servicios globales) disponibles en toda la app.
 *
 * PROVIDERS REGISTRADOS:
 *
 * 1. provideZoneChangeDetection({ eventCoalescing: true })
 *    → Optimización de rendimiento: agrupa múltiples eventos del navegador
 *      en una sola detección de cambios de Angular. Reduce el trabajo innecesario.
 *
 * 2. provideRouter(routes)
 *    → Activa el sistema de navegación SPA (Single Page Application).
 *      Usa las rutas definidas en app.routes.ts.
 *      Angular intercepta los clicks en <a routerLink="..."> y navega
 *      sin recargar la página completa.
 *
 * 3. provideHttpClient(withInterceptors([authInterceptor]))
 *    → Habilita el servicio HttpClient (para hacer peticiones HTTP al backend).
 *      withInterceptors([authInterceptor]) registra el interceptor que adjunta
 *      automáticamente el token JWT en cada petición.
 *      Sin esto, el cliente HTTP no estaría disponible en la app.
 * ============================================================
 */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './services/auth.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
