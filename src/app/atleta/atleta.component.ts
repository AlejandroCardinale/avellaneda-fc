import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {
  ActualizarPerfilPayload,
  AtletaPerfil,
  AtletaService,
  EntrenamientoAtleta,
  ResumenAsistencias
} from './atleta.service';

type AtletaView = 'inicio' | 'entrenamientos' | 'asistencias' | 'perfil';

@Component({
  selector: 'app-atleta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './atleta.component.html',
  styleUrl: './atleta.component.css'
})
export class AtletaComponent implements OnInit {
  view: AtletaView = 'inicio';

  perfil: AtletaPerfil | null = null;
  entrenamientos: EntrenamientoAtleta[] = [];
  asistencias: ResumenAsistencias | null = null;

  loading = true;
  entrenamientosLoading = true;
  asistenciasLoading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  entrenamientosError = '';
  asistenciasError = '';

  // Formulario de edición de perfil
  perfilForm: ActualizarPerfilPayload = {
    nombre: '',
    apellido: '',
    telefono: '',
    password_actual: '',
    password_nueva: ''
  };
  cambiandoPassword = false;

  // Filtro entrenamientos
  filtroEstado: string = 'todos';

  constructor(
    public authService: AuthService,
    private atletaService: AtletaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (!this.authService.isAtleta()) {
      if (this.authService.isAdmin()) this.router.navigate(['/administrador']);
      else if (this.authService.isEntrenador()) this.router.navigate(['/entrenador']);
      else this.router.navigate(['/inicio']);
      return;
    }
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.atletaService.getPerfil().subscribe({
      next: p => {
        this.perfil = p;
        this.perfilForm = {
          nombre: p.nombre,
          apellido: p.apellido,
          telefono: p.telefono || '',
          password_actual: '',
          password_nueva: ''
        };
        this.loading = false;
      },
      error: err => {
        this.errorMessage = err?.error?.message || 'No se pudo cargar el perfil.';
        this.loading = false;
      }
    });

    this.atletaService.getEntrenamientos().subscribe({
      next: e => {
        this.entrenamientos = e;
        this.entrenamientosLoading = false;
      },
      error: err => {
        this.entrenamientosError = err?.error?.message || 'No se pudieron cargar los entrenamientos.';
        this.entrenamientosLoading = false;
      }
    });

    this.atletaService.getAsistencias().subscribe({
      next: a => {
        this.asistencias = a;
        this.asistenciasLoading = false;
      },
      error: err => {
        this.asistenciasError = err?.error?.message || 'No se pudo cargar el historial de asistencias.';
        this.asistenciasLoading = false;
      }
    });
  }

  setView(v: AtletaView): void {
    this.view = v;
    this.errorMessage = '';
    this.successMessage = '';
  }

  get entrenamientosFiltrados(): EntrenamientoAtleta[] {
    if (this.filtroEstado === 'todos') return this.entrenamientos;
    return this.entrenamientos.filter(e => e.estado === this.filtroEstado);
  }

  get proximosEntrenamientos(): EntrenamientoAtleta[] {
    return this.entrenamientos
      .filter(e => e.estado === 'programada' && new Date(e.fecha_hora) >= new Date())
      .slice(0, 3);
  }

  guardarPerfil(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.perfilForm.nombre || !this.perfilForm.apellido) {
      this.errorMessage = 'Nombre y apellido son obligatorios.';
      return;
    }

    const payload: ActualizarPerfilPayload = {
      nombre: this.perfilForm.nombre.trim(),
      apellido: this.perfilForm.apellido.trim(),
      telefono: this.perfilForm.telefono?.trim() || undefined
    };

    if (this.cambiandoPassword) {
      if (!this.perfilForm.password_actual || !this.perfilForm.password_nueva) {
        this.errorMessage = 'Completá la contraseña actual y la nueva.';
        return;
      }
      payload.password_actual = this.perfilForm.password_actual;
      payload.password_nueva = this.perfilForm.password_nueva;
    }

    this.saving = true;
    this.atletaService.actualizarPerfil(payload).subscribe({
      next: res => {
        this.saving = false;
        this.successMessage = res.message;
        this.cambiandoPassword = false;
        this.perfilForm.password_actual = '';
        this.perfilForm.password_nueva = '';
        // Actualizar nombre en pantalla
        if (this.perfil) {
          this.perfil.nombre = payload.nombre;
          this.perfil.apellido = payload.apellido;
          this.perfil.telefono = payload.telefono || null;
        }
      },
      error: err => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'No se pudo actualizar el perfil.';
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

  formatDateOnly(value: string): string {
    return new Date(value).toLocaleDateString('es-AR', { dateStyle: 'medium' });
  }

  estadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      programada: 'Programada',
      en_curso: 'En curso',
      finalizada: 'Finalizada',
      cancelada: 'Cancelada'
    };
    return labels[estado] ?? estado;
  }

  estadoMedicoLabel(estado: string): string {
    const labels: Record<string, string> = {
      apto: 'Apto',
      no_apto: 'No apto',
      pendiente: 'Pendiente'
    };
    return labels[estado] ?? estado;
  }
}
