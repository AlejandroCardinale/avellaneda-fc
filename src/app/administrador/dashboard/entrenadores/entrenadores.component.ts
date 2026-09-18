import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Entrenador, EntrenadoresService } from './entrenadores.service';

@Component({
  selector: 'app-entrenadores',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './entrenadores.component.html',
  styleUrls: ['./entrenadores.component.css']
})
export class EntrenadoresComponent implements OnInit {
  form!: FormGroup;
  entrenadores: Entrenador[] = [];
  modalOpen = false;
  confirmOpen = false;
  isEditMode = false;
  currentEntrenadorId: number | null = null;
  selectedEntrenador: Entrenador | null = null;
  entrenadorToDelete: Entrenador | null = null;
  editingId: number | null = null;
  loading = false;
  listLoading = false;
  errorMessage = '';
  successMessage = '';
  search = '';
  selectedDeporte = 'Todos';
  selectedOrder: 'nameAsc' | 'nameDesc' | 'newest' | 'oldest' = 'nameAsc';

  deportes = [
    { id: 1, nombre: 'Fútbol' },
    { id: 2, nombre: 'Natación' },
    { id: 3, nombre: 'Tenis' },
    { id: 4, nombre: 'Gimnasio' },
    { id: 5, nombre: 'Básquet' },
    { id: 6, nombre: 'Vóley' },
    { id: 7, nombre: 'Atletismo' },
    { id: 8, nombre: 'Artes Marciales' }
  ];

  constructor(
    private fb: FormBuilder,
    private entrenadoresService: EntrenadoresService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.crearFormulario();
    this.cargarEntrenadores();
  }

  get f() {
    return this.form.controls;
  }

  get filteredEntrenadores(): Entrenador[] {
    const query = this.search.trim().toLocaleLowerCase();
    const filtered = this.entrenadores.filter(entrenador => {
      const searchableText = `${entrenador.nombre} ${entrenador.apellido} ${entrenador.email}`.toLocaleLowerCase();
      const matchesText = !query || searchableText.includes(query);
      const matchesSport = this.selectedDeporte === 'Todos' || entrenador.deporte === this.selectedDeporte;
      return matchesText && matchesSport;
    });

    return [...filtered].sort((first, second) => {
      if (this.selectedOrder === 'newest' || this.selectedOrder === 'oldest') {
        const firstDate = new Date(first.fecha_ingreso || 0).getTime();
        const secondDate = new Date(second.fecha_ingreso || 0).getTime();
        return this.selectedOrder === 'newest' ? secondDate - firstDate : firstDate - secondDate;
      }

      const firstName = `${first.apellido} ${first.nombre}`.toLocaleLowerCase();
      const secondName = `${second.apellido} ${second.nombre}`.toLocaleLowerCase();
      const comparison = firstName.localeCompare(secondName, 'es');
      return this.selectedOrder === 'nameAsc' ? comparison : -comparison;
    });
  }

  get availableSports(): string[] {
    return ['Todos', ...new Set(this.entrenadores
      .map(entrenador => entrenador.deporte)
      .filter((value): value is string => Boolean(value)))];
  }

  clearFilters(): void {
    this.search = '';
    this.selectedDeporte = 'Todos';
    this.selectedOrder = 'nameAsc';
  }

  private crearFormulario(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.minLength(7)]],
      deporte_id: [1, Validators.required],
      especialidad: ['', [Validators.required, Validators.minLength(3)]],
      licencia: [''],
      estado_inicial: ['activo', Validators.required]
    });
  }

  cargarEntrenadores(): void {
    this.listLoading = true;
    this.entrenadoresService.listar().subscribe({
      next: (data) => {
        this.entrenadores = data;
        this.listLoading = false;
      },
      error: (error) => {
        this.entrenadores = [];
        this.listLoading = false;
        this.errorMessage = error?.error?.message || 'No se pudieron cargar los entrenadores.';
      }
    });
  }

  abrirNuevo(): void {
    this.isEditMode = false;
    this.currentEntrenadorId = null;
    this.editingId = null;
    this.form.reset(this.defaultFormValue());
    this.errorMessage = '';
    this.modalOpen = true;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Completa los campos obligatorios antes de guardar.';
      return;
    }

    this.loading = true;
    if (this.isEditMode && this.currentEntrenadorId === null) {
      this.loading = false;
      this.errorMessage = 'No se pudo identificar el entrenador que quieres actualizar.';
      return;
    }

    const request = this.isEditMode
      ? this.entrenadoresService.actualizar(this.currentEntrenadorId as number, this.form.value)
      : this.entrenadoresService.registrar(this.form.value);

    request.subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.message;
        this.cerrarModal();
        this.cargarEntrenadores();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'No se pudo guardar el entrenador.';
      }
    });
  }

  editar(entrenador: Entrenador): void {
    const entrenadorId = Number(entrenador.id ?? (entrenador as Entrenador & { _id?: number })._id);
    if (!Number.isInteger(entrenadorId) || entrenadorId <= 0) {
      this.errorMessage = 'No se pudo identificar el entrenador seleccionado.';
      return;
    }

    this.isEditMode = true;
    this.currentEntrenadorId = entrenadorId;
    this.editingId = entrenadorId;
    this.form.reset(this.defaultFormValue(), { emitEvent: false });
    this.errorMessage = '';
    this.successMessage = '';
    this.form.patchValue({
      nombre: entrenador.nombre || '',
      apellido: entrenador.apellido || '',
      email: entrenador.email || '',
      telefono: entrenador.telefono || '',
      deporte_id: entrenador.deporte_id || 1,
      especialidad: entrenador.especialidad || '',
      licencia: entrenador.licencia || '',
      estado_inicial: entrenador.estado || 'activo'
    });
    this.modalOpen = true;
  }

  ver(entrenador: Entrenador): void {
    const entrenadorId = Number(entrenador.id ?? (entrenador as Entrenador & { _id?: number })._id);
    if (!Number.isInteger(entrenadorId) || entrenadorId <= 0) {
      this.errorMessage = 'No se pudo identificar el entrenador seleccionado.';
      return;
    }

    this.selectedEntrenador = { ...entrenador, id: entrenadorId };
    this.errorMessage = '';
  }

  cerrarDetalle(): void {
    this.selectedEntrenador = null;
  }

  eliminar(entrenador: Entrenador): void {
    this.entrenadorToDelete = entrenador;
    this.confirmOpen = true;
  }

  cancelarEliminacion(): void {
    this.confirmOpen = false;
    this.entrenadorToDelete = null;
  }

  confirmarEliminacion(): void {
    if (!this.entrenadorToDelete) return;

    this.entrenadoresService.eliminar(this.entrenadorToDelete.id).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.cancelarEliminacion();
        this.cargarEntrenadores();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'No se pudo eliminar el entrenador.';
        this.cancelarEliminacion();
      }
    });
  }

  cerrarModal(): void {
    if (this.loading) return;
    this.modalOpen = false;
    this.isEditMode = false;
    this.currentEntrenadorId = null;
    this.editingId = null;
    this.form.reset(this.defaultFormValue(), { emitEvent: false });
  }

  getEstadoLabel(estado?: string): string {
    return estado === 'inactivo' ? 'Inactivo' : 'Activo';
  }

  cancelarEdicion(): void {
    this.cerrarModal();
  }

  volver(): void {
    this.router.navigate(['/administrador/home']);
  }

  private resetForm(): void {
    this.editingId = null;
    this.form.reset({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      deporte_id: 1,
      especialidad: '',
      licencia: '',
      estado_inicial: 'activo'
    });
  }

  private defaultFormValue() {
    return {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      deporte_id: 1,
      especialidad: '',
      estado_inicial: 'activo'
    };
  }
}
