import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Entrenamiento,
  EntrenamientoPayload,
  ListaAsistencia
} from '../entrenador.service';
import { EntrenadorViewBase } from '../entrenador-view.base';

@Component({
  selector: 'app-entrenador-entrenamientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entrenamientos.component.html',
  styleUrl: '../entrenador-layout.component.css'
})
export class EntrenamientosComponent extends EntrenadorViewBase implements OnInit {
  readonly view = 'entrenamientos';
  sesiones: Entrenamiento[] = [];
  categorias: { id: number; nombre: string }[] = [];
  instalaciones: { id: number; nombre: string }[] = [];
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
  sessionForm: EntrenamientoPayload = this.emptySessionForm();

  ngOnInit(): void {
    this.loadAll();
    if (this.router.parseUrl(this.router.url).queryParams['nuevo'] === 'true') {
      this.newSession();
    }
  }

  get presentAttendanceCount(): number {
    return this.attendance.filter(row => Boolean(row.presente)).length;
  }

  loadAll(): void {
    this.loading = true;
    this.errorMessage = '';
    this.service.listarSesiones().subscribe({
      next: sessions => {
        this.sesiones = sessions;
        this.loading = false;
      },
      error: error => {
        this.errorMessage = error?.error?.message || 'No se pudieron cargar los entrenamientos.';
        this.loading = false;
      }
    });
    this.service.catalogos().subscribe({
      next: data => {
        this.categorias = data.categorias;
        this.instalaciones = data.instalaciones;
      },
      error: error => {
        this.errorMessage = error?.error?.message || 'No se pudieron cargar las opciones.';
      }
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
      next: response => {
        this.successMessage = response.message;
        this.loadAll();
      },
      error: error => this.errorMessage = error?.error?.message || 'No se pudo cambiar el estado.'
    });
  }

  openAttendance(session: Entrenamiento): void {
    this.attendanceSessionId = session.id;
    this.attendanceSessionTitle = session.titulo;
    this.attendanceReadOnly = session.estado === 'finalizada';
    this.attendanceLoading = true;
    this.attendanceError = '';
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
