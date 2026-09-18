import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./dashboard/home/administrador.component').then(m => m.AdministradorComponent)
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./dashboard/gestion-usuarios/gestion-usuarios.component').then(m => m.GestionUsuariosComponent)
  },
  {
    path: 'registrar-atleta',
    loadComponent: () => import('./dashboard/registrar-atleta/registrar-atleta.component').then(m => m.RegistrarAtletaComponent)
  },
  {
    path: 'entrenadores',
    loadComponent: () => import('./dashboard/entrenadores/entrenadores.component').then(m => m.EntrenadoresComponent)
  },
  {
    path: 'noticias',
    loadComponent: () => import('./dashboard/gestion-noticias/gestion-noticias.component').then(m => m.GestionNoticiasComponent)
  },
  {
    path: 'recursos',
    loadComponent: () => import('./dashboard/recursos-deportivos/recursos-deportivos.component').then(m => m.RecursosDeportivosComponent)
  },
  {
    path: 'deportes',
    loadComponent: () => import('./dashboard/deportes/deportes.component').then(m => m.DeportesAdminComponent)
  },
  { path: 'solicitudes', redirectTo: 'home', pathMatch: 'full' },
  { path: 'eventos', redirectTo: 'home', pathMatch: 'full' },
  { path: 'instalaciones', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'reportes',
    loadComponent: () => import('./dashboard/reportes/reportes.component').then(m => m.ReportesAdminComponent)
  }
    path: 'solicitudes-acceso',
    loadComponent: () => import('./dashboard/solicitudes-acceso/solicitudes-acceso.component').then(m => m.SolicitudesAccesoComponent)
  },
  { path: 'noticias',    redirectTo: 'usuarios', pathMatch: 'full' },
  { path: 'recursos',    redirectTo: 'usuarios', pathMatch: 'full' },
  { path: 'solicitudes', redirectTo: 'solicitudes-acceso', pathMatch: 'full' },
  { path: 'reportes',    redirectTo: 'solicitudes-acceso', pathMatch: 'full' }
];
