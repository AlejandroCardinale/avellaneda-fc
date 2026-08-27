import { Routes } from '@angular/router';

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
  { path: '**', redirectTo: '/inicio' }
];
