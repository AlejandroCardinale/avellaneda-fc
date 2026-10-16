import { Routes } from '@angular/router';

export const entrenadorRoutes: Routes = [
  { path: '', redirectTo: 'resumen', pathMatch: 'full' },
  {
    path: 'resumen',
    loadComponent: () => import('./resumen/resumen.component').then(m => m.ResumenComponent)
  },
  {
    path: 'plantel',
    loadComponent: () => import('./plantel/plantel.component').then(m => m.PlantelComponent)
  },
  {
    path: 'entrenamientos',
    loadComponent: () => import('./entrenamientos/entrenamientos.component').then(m => m.EntrenamientosComponent)
  },
  {
    path: 'solicitudes',
    loadComponent: () => import('./solicitudes/solicitudes.component').then(m => m.SolicitudComponent)
  }
];
