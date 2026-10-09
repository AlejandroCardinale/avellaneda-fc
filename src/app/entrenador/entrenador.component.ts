import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {
  AtletaEntrenador,
  EntrenadorDashboard,
  EntrenadorService,
  Entrenamiento,
  EntrenamientoPayload,
  ListaAsistencia,
  ResumenAsistenciaAtleta
} from './entrenador.service';

type CoachView = 'inicio' | 'atletas' | 'entrenamientos';

@Component({
  selector: 'app-entrenador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './entrenador.component.html',
  styleUrl: './entrenador.component.css'
})
export class EntrenadorComponent implements OnInit {
  view: CoachView = 'inicio';
  dashboard: EntrenadorDashboard | null = null;
  atletas: AtletaEntrenador[] = [];
  sesiones: Entrenamiento[] = [];
  categorias: { id: number; nombre: string }[] = [];
  instalaciones: { id: number; nombre: string }[] = [];
  search = '';
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  showSessionForm = false;
  editingSessionId: number | null = null;
  attendanceSessionId: number | null = null;
  attendanceSessionTitle = '';
  attendance: ListaAsistencia[] = [];
  attendanceLoading = false;
  attendanceSaving = false;
  attendanceReadOnly = false;
  attendanceError = '';
  readonly absenceReasons = ['Médico', 'Fuerza Mayor', 'Ausente con prev. aviso', 'Día de estudio', 'Otro', 'Injustificado'];
  selectedAthlete: AtletaEntrenador | null = null;
  athleteAttendance: ResumenAsistenciaAtleta | null = null;
  athleteDetailsLoading = false;
  athleteDetailsError = '';
  sessionForm: EntrenamientoPayload = this.emptySessionForm();

  constructor(
    public authService: AuthService,
    private service: EntrenadorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (!this.authService.isEntrenador()) {
      this.router.navigate([this.authService.isAdmin() ? '/administrador' : '/inicio']);
      return;
    }
    this.loadAll();
  }

  get filteredAthletes(): AtletaEntrenador[] {
    const query = this.search.trim().toLocaleLowerCase();
    if (!query) return this.atletas;
    return this.atletas.filter(athlete =>
      `${athlete.nombre} ${athlete.apellido} ${athlete.email} ${athlete.categoria || ''}`.toLocaleLowerCase().includes(query)
    );
  }

  get presentAttendanceCount(): number {
    return this.attendance.filter(row => Boolean(row.presente)).length;
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

  setView(view: CoachView): void {
    this.view = view;
    this.errorMessage = '';
    this.successMessage = '';
  }

  loadAll(): void {
    this.loading = true;
    this.service.dashboard().subscribe({
      next: dashboard => { this.dashboard = dashboard; this.loading = false; },
      error: error => { this.errorMessage = error?.error?.message || 'No se pudo cargar el panel.'; this.loading = false; }
    });
    this.service.listarAtletas().subscribe({
      next: athletes => this.atletas = athletes,
      error: error => this.errorMessage = error?.error?.message || 'No se pudo cargar el plantel.'
    });
    this.service.listarSesiones().subscribe({
      next: sessions => this.sesiones = sessions,
      error: error => this.errorMessage = error?.error?.message || 'No se pudieron cargar los entrenamientos.'
    });
    this.service.catalogos().subscribe({
      next: data => { this.categorias = data.categorias; this.instalaciones = data.instalaciones; },
      error: error => this.errorMessage = error?.error?.message || 'No se pudieron cargar las opciones.'
    });
  }

  newSession(): void {
    this.editingSessionId = null;
    this.sessionForm = this.emptySessionForm();
    this.errorMessage = '';
    this.showSessionForm = true;
  }

  editSession(session: Entrenamiento): void {
    this.editingSessionId = session.id;
    this.sessionForm = {
      titulo: session.titulo,
      descripcion: session.descripcion || '',
      fecha_hora: this.toLocalInput(session.fecha_hora),
      duracion_min: session.duracion_min,
      categoria_id: session.categoria_id || null,
      instalacion_id: session.instalacion_id || null
    };
    this.errorMessage = '';
    this.showSessionForm = true;
  }

  closeSessionForm(): void {
    if (!this.saving) this.showSessionForm = false;
  }

  saveSession(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.saving = true;
    const request = this.editingSessionId
      ? this.service.actualizarSesion(this.editingSessionId, this.sessionForm)
      : this.service.crearSesion(this.sessionForm);
    request.subscribe({
      next: response => {
        this.saving = false;
        this.successMessage = response.message;
        this.showSessionForm = false;
        this.loadAll();
      },
      error: error => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'No se pudo guardar el entrenamiento.';
      }
    });
  }

  changeSessionState(session: Entrenamiento, state: Entrenamiento['estado']): void {
    if (state === 'cancelada' && !confirm(`¿Cancelar "${session.titulo}"?`)) return;
    this.service.cambiarEstadoSesion(session.id, state).subscribe({
      next: response => { this.successMessage = response.message; this.loadAll(); },
      error: error => this.errorMessage = error?.error?.message || 'No se pudo cambiar el estado.'
    });
  }

  openAttendance(session: Entrenamiento): void {
    this.attendanceSessionId = session.id;
    this.attendanceSessionTitle = session.titulo;
    this.attendanceReadOnly = session.estado === 'finalizada';
    this.attendanceLoading = true;
    this.attendanceError = '';
    this.errorMessage = '';
    this.service.obtenerAsistencia(session.id).subscribe({
      next: rows => {
        this.attendance = rows.map(row => {
          const presente = Boolean(row.presente);
          const observacion = presente ? '' : (row.observacion || '').trim();
          return {
            ...row,
            presente,
            observacion: this.absenceReasons.includes(observacion) ? observacion : observacion ? 'Otro' : ''
          };
        });
        this.attendanceLoading = false;
      },
      error: error => {
        this.attendanceLoading = false;
        this.attendanceError = error?.error?.message || 'No se pudo cargar la asistencia.';
      }
    });
  }

  closeAttendance(): void {
    if (!this.attendanceSaving) {
      this.attendanceSessionId = null;
      this.attendanceReadOnly = false;
      this.attendanceError = '';
    }
  }

  onAttendancePresenceChange(row: ListaAsistencia, present: boolean): void {
    row.presente = present;
    if (present) row.observacion = '';
  }

  saveAttendance(): void {
    if (this.attendanceSessionId === null || this.attendanceReadOnly) return;
    this.attendanceError = '';
    if (this.attendance.some(row => !row.presente && !row.observacion)) {
      this.attendanceError = 'Selecciona un motivo para cada ausencia.';
      return;
    }
    this.attendanceSaving = true;
    this.service.guardarAsistencia(this.attendanceSessionId, this.attendance.map(row => ({
      atleta_id: row.atleta_id,
      presente: Boolean(row.presente),
      observacion: row.observacion || ''
    }))).subscribe({
      next: response => {
        this.attendanceSaving = false;
        this.successMessage = response.message;
        this.attendanceSessionId = null;
        this.loadAll();
      },
      error: error => {
        this.attendanceSaving = false;
        this.attendanceError = error?.error?.message || 'No se pudo guardar la asistencia.';
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
  }

  estadoLabel(state: Entrenamiento['estado']): string {
    return ({ programada: 'Programada', en_curso: 'En curso', finalizada: 'Finalizada', cancelada: 'Cancelada' })[state];
  }

  private emptySessionForm(): EntrenamientoPayload {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    return {
      titulo: '',
      descripcion: '',
      fecha_hora: this.toLocalInput(start.toISOString()),
      duracion_min: 90,
      categoria_id: null,
      instalacion_id: null
    };
  }

  private toLocalInput(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  }
}