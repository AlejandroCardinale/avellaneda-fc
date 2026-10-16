import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AtletaEntrenador, EntrenadorDashboard, ResumenAsistenciaAtleta } from '../entrenador.service';
import { EntrenadorViewBase } from '../entrenador-view.base';

@Component({
  selector: 'app-entrenador-plantel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plantel.component.html',
  styleUrl: '../entrenador-layout.component.css'
})
export class PlantelComponent extends EntrenadorViewBase implements OnInit {
  readonly view = 'atletas';
  dashboard: EntrenadorDashboard | null = null;
  atletas: AtletaEntrenador[] = [];
  search = '';
  loading = true;
  errorMessage = '';
  selectedAthlete: AtletaEntrenador | null = null;
  athleteAttendance: ResumenAsistenciaAtleta | null = null;
  athleteDetailsLoading = false;
  athleteDetailsError = '';
  private pendingLoads = 2;

  ngOnInit(): void {
    this.service.dashboard().subscribe({
      next: dashboard => {
        this.dashboard = dashboard;
        this.finishLoading();
      },
      error: error => {
        this.errorMessage = error?.error?.message || 'No se pudo cargar el panel.';
        this.finishLoading();
      }
    });
    this.service.listarAtletas().subscribe({
      next: athletes => {
        this.atletas = athletes;
        this.finishLoading();
      },
      error: error => {
        this.errorMessage = error?.error?.message || 'No se pudo cargar el plantel.';
        this.finishLoading();
      }
    });
  }

  get filteredAthletes(): AtletaEntrenador[] {
    const query = this.search.trim().toLocaleLowerCase();
    if (!query) return this.atletas;
    return this.atletas.filter(athlete =>
      `${athlete.nombre} ${athlete.apellido} ${athlete.email} ${athlete.categoria || ''}`.toLocaleLowerCase().includes(query)
    );
  }

  openAthleteDetails(athlete: AtletaEntrenador): void {
    this.selectedAthlete = athlete;
    this.athleteAttendance = null;
    this.athleteDetailsError = '';
    this.athleteDetailsLoading = true;
    this.service.resumenAsistenciaAtleta(athlete.id).subscribe({
      next: summary => {
        if (this.selectedAthlete?.id !== athlete.id) return;
        this.athleteAttendance = summary;
        this.athleteDetailsLoading = false;
      },
      error: error => {
        if (this.selectedAthlete?.id !== athlete.id) return;
        this.athleteDetailsError = error?.error?.message || 'No se pudo cargar la asistencia del atleta.';
        this.athleteDetailsLoading = false;
      }
    });
  }

  closeAthleteDetails(): void {
    this.selectedAthlete = null;
    this.athleteAttendance = null;
    this.athleteDetailsError = '';
  }

  private finishLoading(): void {
    this.pendingLoads -= 1;
    this.loading = this.pendingLoads > 0;
  }
}
