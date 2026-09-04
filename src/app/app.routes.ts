/**
 * ============================================================
 * APP.ROUTES.TS — Definición de Rutas del Frontend
 * ============================================================
 * Este archivo define el mapa de navegación de la aplicación Angular.
 * Cada ruta asocia una URL con un componente específico.
 *
 * LAZY LOADING:
 *   Todas las rutas usan "loadComponent" con import() dinámico.
 *   Esto significa que cada página se descarga del servidor SOLO cuando
 *   el usuario navega a ella, no todas juntas al inicio.
 *   Resultado: carga inicial más rápida de la aplicación.
 *
 * RUTAS DISPONIBLES:
 *   /inicio          → Página principal con noticias y accesos rápidos
 *   /noticias        → Listado de noticias del club
 *   /deportes        → Información de los deportes del club
 *   /instalaciones   → Canchas, piletas y otras instalaciones
 *   /eventos         → Calendario de eventos
 *   /contacto        → Formulario de contacto
 *   /login           → Inicio de sesión
 *   /registro        → Registro de nuevo usuario
 *   /solicitud       → Módulo de solicitudes (requiere login)
 *   /reportes        → Módulo de reportes (solo administrador)
 *   **               → Cualquier otra URL redirige a /inicio
 * ============================================================
 */
import { Routes } from '@angular/router';

export const routes: Routes = [
  // Ruta raíz: redirige automáticamente a /inicio
  { path: '', redirectTo: '/inicio', pathMatch: 'full' },

  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.component').then(m => m.InicioComponent)
  },
  {
    path: 'noticias',
    loadComponent: () => import('./pages/noticias/noticias.component').then(m => m.NoticiasComponent)
  },
  {
    path: 'deportes',
    loadComponent: () => import('./pages/deportes/deportes.component').then(m => m.DeportesComponent)
  },
  {
    path: 'instalaciones',
    loadComponent: () => import('./pages/instalaciones/instalaciones.component').then(m => m.InstalacionesComponent)
  },
  {
    path: 'eventos',
    loadComponent: () => import('./pages/eventos/eventos.component').then(m => m.EventosComponent)
  },
  {
    path: 'contacto',
    loadComponent: () => import('./pages/contacto/contacto.component').then(m => m.ContactoComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    // Módulo de solicitudes: entrenadores piden indumentaria, equipamiento o transporte
    path: 'solicitud',
    loadComponent: () => import('./pages/solicitud/solicitud.component').then(m => m.SolicitudComponent)
  },
  {
    // Módulo de reportes: vista para administradores (gestión de solicitudes, etc.)
    path: 'reportes',
    loadComponent: () => import('./pages/reportes/reportes.component').then(m => m.ReportesComponent)
  },
  {
    // Registro de nuevos usuarios: crea cuenta con rol 'atleta' por defecto
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.component').then(m => m.RegistroComponent)
  },

  // Wildcard: cualquier URL no definida redirige al inicio
  { path: '**', redirectTo: '/inicio' }
];
