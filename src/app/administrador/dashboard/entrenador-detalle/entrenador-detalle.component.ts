import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AtletaAsignado, Entrenador, EntrenadoresService } from '../entrenadores/entrenadores.service';

@Component({
  selector: 'app-entrenador-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entrenador-detalle.component.html',
  styleUrls: ['./entrenador-detalle.component.css']
})
export class EntrenadorDetalleComponent implements OnInit {
  entrenadorId!: number;
  entrenador: Entrenador | null = null;
  atletas: AtletaAsignado[] = [];
  atletasDisponibles: AtletaAsignado[] = [];

  loadingCoach = true;
  loadingAtletas = true;
  loadingDisponibles = false;
  submitting = false;

  errorMessage = '';
  successMessage = '';

  // Modal de asignación
  modalAsignarOpen = false;
  filtroAtleta = '';
  atletaSeleccionadoId: number | null = null;

  // Diálogo de confirmación para quitar atleta
  confirmQuitarOpen = false;
  atletaAQuitar: AtletaAsignado | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entrenadoresService: EntrenadoresService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const parsedId = Number(idParam);

    if (!parsedId || isNaN(parsedId) || parsedId <= 0) {
      this.errorMessage = 'Identificador de entrenador inválido.';
      this.loadingCoach = false;
      this.loadingAtletas = false;
      return;
    }

    this.entrenadorId = parsedId;
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargarEntrenador();
    this.cargarAtletasAsignados();
  }

  cargarEntrenador(): void {
    this.loadingCoach = true;
    this.entrenadoresService.obtenerPorId(this.entrenadorId).subscribe({
      next: (data) => {
        this.entrenador = data;
        this.loadingCoach = false;
      },
      error: (err) => {
        this.loadingCoach = false;
        this.errorMessage = err?.error?.message || 'No se pudo obtener la información del entrenador.';
      }
    });
  }

  cargarAtletasAsignados(): void {
    this.loadingAtletas = true;
    this.entrenadoresService.listarAtletas(this.entrenadorId).subscribe({
      next: (data) => {
        this.atletas = data;
        this.loadingAtletas = false;
      },
      error: (err) => {
        this.loadingAtletas = false;
        this.errorMessage = err?.error?.message || 'Error al cargar los atletas asignados.';
      }
    });
  }

  get atletasDisponiblesFiltrados(): AtletaAsignado[] {
    const q = this.filtroAtleta.trim().toLowerCase();
    if (!q) return this.atletasDisponibles;

    return this.atletasDisponibles.filter(a => {
      const full = `${a.nombre} ${a.apellido} ${a.email} ${a.dni || ''}`.toLowerCase();
      return full.includes(q);
    });
  }

  abrirModalAsignacion(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.filtroAtleta = '';
    this.atletaSeleccionadoId = null;
    this.loadingDisponibles = true;
    this.modalAsignarOpen = true;

    this.entrenadoresService.listarAtletasDisponibles(this.entrenadorId).subscribe({
      next: (data) => {
        this.atletasDisponibles = data;
        this.loadingDisponibles = false;
      },
      error: (err) => {
        this.loadingDisponibles = false;
        this.errorMessage = err?.error?.message || 'Error al obtener atletas disponibles.';
      }
    });
  }

  cerrarModalAsignacion(): void {
    if (this.submitting) return;
    this.modalAsignarOpen = false;
    this.atletaSeleccionadoId = null;
    this.filtroAtleta = '';
  }

  seleccionarAtleta(atleta: AtletaAsignado): void {
    this.atletaSeleccionadoId = atleta.id;
  }

  confirmarAsignacion(): void {
    if (!this.atletaSeleccionadoId) {
      this.errorMessage = 'Por favor, selecciona un atleta para asignar.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    this.entrenadoresService.asignarAtleta(this.atletaSeleccionadoId, this.entrenadorId).subscribe({
      next: (res) => {
        this.submitting = false;
        this.successMessage = res.message || 'Atleta asignado correctamente.';
        this.cerrarModalAsignacion();
        this.cargarAtletasAsignados();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err?.error?.message || 'No se pudo asignar el atleta.';
      }
    });
  }

  iniciarQuitarAtleta(atleta: AtletaAsignado): void {
    this.atletaAQuitar = atleta;
    this.confirmQuitarOpen = true;
  }

  cancelarQuitarAtleta(): void {
    this.confirmQuitarOpen = false;
    this.atletaAQuitar = null;
  }

  confirmarQuitarAtleta(): void {
    if (!this.atletaAQuitar) return;

    this.submitting = true;
    this.errorMessage = '';
    const atletaId = this.atletaAQuitar.id;

    this.entrenadoresService.asignarAtleta(atletaId, null).subscribe({
      next: (res) => {
        this.submitting = false;
        this.successMessage = res.message || 'Atleta desvinculado correctamente.';
        this.cancelarQuitarAtleta();
        this.cargarAtletasAsignados();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err?.error?.message || 'No se pudo desvincular el atleta.';
        this.cancelarQuitarAtleta();
      }
    });
  }

  volver(): void {
    this.router.navigate(['/administrador/entrenadores']);
  }

  getIniciales(nombre?: string, apellido?: string): string {
    const n = nombre ? nombre.trim().charAt(0) : '';
    const a = apellido ? apellido.trim().charAt(0) : '';
    return (n + a).toUpperCase() || 'E';
  }
}
