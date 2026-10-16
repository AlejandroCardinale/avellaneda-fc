import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { EntrenadorDashboard } from '../entrenador.service';
import { EntrenadorViewBase } from '../entrenador-view.base';

@Component({
  selector: 'app-entrenador-resumen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resumen.component.html',
  styleUrl: '../entrenador-layout.component.css'
})
export class ResumenComponent extends EntrenadorViewBase implements OnInit {
  readonly view = 'inicio';
  dashboard: EntrenadorDashboard | null = null;
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.service.dashboard().subscribe({
      next: dashboard => {
        this.dashboard = dashboard;
        this.loading = false;
      },
      error: error => {
        this.errorMessage = error?.error?.message || 'No se pudo cargar el panel.';
        this.loading = false;
      }
    });
  }

  setView(view: 'inicio' | 'atletas' | 'entrenamientos'): void {
    const paths = { inicio: 'resumen', atletas: 'plantel', entrenamientos: 'entrenamientos' };
    void this.router.navigate(['/entrenador', paths[view]]);
  }

  newSession(): void {
    void this.router.navigate(['/entrenador/entrenamientos'], { queryParams: { nuevo: 'true' } });
  }
}
