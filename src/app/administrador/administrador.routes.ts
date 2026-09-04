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
  { path: 'noticias', redirectTo: 'usuarios', pathMatch: 'full' },
  { path: 'recursos', redirectTo: 'usuarios', pathMatch: 'full' },
  { path: 'solicitudes', redirectTo: 'usuarios', pathMatch: 'full' },
  { path: 'reportes', redirectTo: 'usuarios', pathMatch: 'full' }
];
