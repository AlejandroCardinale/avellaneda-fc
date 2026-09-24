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
 *   /recuperar-contrasena → Formulario para solicitar recuperación por email
 *   /nueva-contrasena    → Formulario para ingresar la nueva contraseña (usa ?token=)
 *   **               → Cualquier otra URL redirige a /inicio
 * ============================================================
 */
import { Routes } from '@angular/router';
import { adminRoutes } from './administrador/administrador.routes';

export const routes: Routes = [
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
    path: 'deportes/:id',
    loadComponent: () => import('./pages/deportes-detalle/deportes-detalle.component').then(m => m.DeportesDetalleComponent)
  },
  {
    path: 'instalaciones',
    loadComponent: () => import('./pages/instalaciones/instalaciones.component').then(m => m.InstalacionesComponent)
  },
  {
    path: 'instalaciones/:id',
    loadComponent: () => import('./pages/instalaciones-detalle/instalaciones-detalle.component').then(m => m.InstalacionesDetalleComponent)
  },
  {
    path: 'eventos',
    loadComponent: () => import('./pages/eventos/eventos.component').then(m => m.EventosComponent)
  },
  {
    path: 'eventos/:id',
    loadComponent: () => import('./pages/eventos-detalle/eventos-detalle.component').then(m => m.EventosDetalleComponent)
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
    path: 'solicitud',
    loadComponent: () => import('./pages/solicitud/solicitud.component').then(m => m.SolicitudComponent)
  },
  {
    path: 'reportes',
    loadComponent: () => import('./pages/reportes/reportes.component').then(m => m.ReportesComponent)
  },
  {
    path: 'administrador',
    loadComponent: () => import('./administrador/dashboard/dashboard.component').then(m => m.DashboardComponent),
    children: adminRoutes
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.component').then(m => m.RegistroComponent)
  },

  {
    path: 'recuperar-contrasena',
    loadComponent: () => import('./pages/recuperar-contrasena/recuperar-contrasena.component').then(m => m.RecuperarContrasenaComponent)
  },
  {
    path: 'nueva-contrasena',
    loadComponent: () => import('./pages/nueva-contrasena/nueva-contrasena.component').then(m => m.NuevaContrasenaComponent)
  },

  { path: '**', redirectTo: '/inicio' }
];
