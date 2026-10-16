import { Directive, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EntrenadorService, Entrenamiento } from './entrenador.service';

@Directive()
export abstract class EntrenadorViewBase {
  protected readonly service = inject(EntrenadorService);
  protected readonly router = inject(Router);

  formatDate(value: string): string {
    return new Date(value).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
  }

  estadoLabel(state: Entrenamiento['estado']): string {
    return ({ programada: 'Programada', en_curso: 'En curso', finalizada: 'Finalizada', cancelada: 'Cancelada' })[state];
  }
}
