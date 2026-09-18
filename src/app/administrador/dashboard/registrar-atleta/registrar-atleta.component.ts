import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AtletaListado, RegistrarAtletaResponse, RegistrarAtletaService, ActualizarAtletaResponse } from './registrar-atleta.service';

@Component({
  selector: 'app-registrar-atleta',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './registrar-atleta.component.html',
  styleUrl: './registrar-atleta.component.css'
})
export class RegistrarAtletaComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  athletesLoading = false;
  modalOpen = false;
  confirmOpen = false;
  isEditMode = false;
  currentAtletaId: number | null = null;
  editingAtleta: AtletaListado | null = null;
  selectedAtleta: AtletaListado | null = null;
  atletaToDelete: AtletaListado | null = null;
  errorMessage = '';
  successMessage = '';
  atletas: AtletaListado[] = [];
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

  categorias = [
    { id: 1, nombre: 'Infantil' },
    { id: 2, nombre: 'Sub-15' },
    { id: 3, nombre: 'Sub-17' },
    { id: 4, nombre: 'Primera División' },
    { id: 5, nombre: 'Bebés' },
    { id: 6, nombre: 'Niños' },
    { id: 7, nombre: 'Adultos' },
    { id: 8, nombre: 'Singles' },
    { id: 9, nombre: 'Dobles' },
    { id: 10, nombre: 'Sub-15' },
    { id: 11, nombre: 'Sub-17' },
    { id: 12, nombre: 'Primera Masculino' },
    { id: 13, nombre: 'Primera Femenino' },
    { id: 14, nombre: 'Masculino' },
    { id: 15, nombre: 'Femenino' },
    { id: 16, nombre: 'Judo' },
    { id: 17, nombre: 'Karate' },
    { id: 18, nombre: 'Taekwondo' }
  ];

  constructor(
    private fb: FormBuilder,
    private registrarAtletaService: RegistrarAtletaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      fecha_nacimiento: ['', Validators.required],
      genero: ['Masculino', Validators.required],
      dni: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.minLength(7)]],
      direccion: ['', Validators.required],
      deporte_id: [1, Validators.required],
      categoria_id: [1, Validators.required],
      fecha_inscripcion: [today, Validators.required],
      estado_inicial: ['activo', Validators.required]
    });

    this.cargarAtletas();
  }

  get f() {
    return this.form.controls;
  }

  get filteredAtletas(): AtletaListado[] {
    const query = this.search.trim().toLocaleLowerCase();
    const filtered = this.atletas.filter(atleta => {
      const matchesText = !query || `${atleta.nombre} ${atleta.apellido} ${atleta.email}`.toLocaleLowerCase().includes(query);
      const matchesSport = this.selectedDeporte === 'Todos' || atleta.deporte === this.selectedDeporte;
      return matchesText && matchesSport;
    });

    return [...filtered].sort((first, second) => {
      if (this.selectedOrder === 'newest' || this.selectedOrder === 'oldest') {
        const firstDate = new Date(first.fecha_inscripcion || 0).getTime();
        const secondDate = new Date(second.fecha_inscripcion || 0).getTime();
        return this.selectedOrder === 'newest' ? secondDate - firstDate : firstDate - secondDate;
      }

      const firstName = `${first.apellido} ${first.nombre}`.toLocaleLowerCase();
      const secondName = `${second.apellido} ${second.nombre}`.toLocaleLowerCase();
      const comparison = firstName.localeCompare(secondName, 'es');
      return this.selectedOrder === 'nameAsc' ? comparison : -comparison;
    });
  }

  get availableSports(): string[] {
    return ['Todos', ...new Set(this.atletas.map(atleta => atleta.deporte).filter((value): value is string => Boolean(value)))];
  }

  clearFilters(): void {
    this.search = '';
    this.selectedDeporte = 'Todos';
    this.selectedOrder = 'nameAsc';
  }

  cargarAtletas(): void {
    this.athletesLoading = true;
    this.registrarAtletaService.getAtletas().subscribe({
      next: (data) => {
        this.atletas = data;
        this.athletesLoading = false;
      },
      error: () => {
        this.atletas = [];
        this.athletesLoading = false;
      }
    });
  }

  abrirNuevo(): void {
    this.isEditMode = false;
    this.currentAtletaId = null;
    this.editingAtleta = null;
    this.form.reset(this.defaultFormValue());
    this.errorMessage = '';
    this.modalOpen = true;
  }

  editarAtleta(atleta: AtletaListado): void {
    const atletaId = Number(atleta.id ?? (atleta as AtletaListado & { _id?: number })._id);
    if (!Number.isInteger(atletaId) || atletaId <= 0) {
      this.errorMessage = 'No se pudo identificar el atleta seleccionado.';
      return;
    }

    this.isEditMode = true;
    this.currentAtletaId = atletaId;
    this.editingAtleta = { ...atleta, id: atletaId };
    this.form.reset(this.defaultFormValue(), { emitEvent: false });
    this.form.patchValue({
      nombre: atleta.nombre || '',
      apellido: atleta.apellido || '',
      dni: atleta.dni || '',
      email: atleta.email || '',
      telefono: atleta.telefono || '',
      fecha_nacimiento: this.toDateInputValue(atleta.fecha_nacimiento),
      fecha_inscripcion: this.toDateInputValue(atleta.fecha_inscripcion) || new Date().toISOString().split('T')[0],
      deporte_id: this.toNumberOrNull(atleta.deporte_id),
      categoria_id: this.toNumberOrNull(atleta.categoria_id),
      estado_inicial: atleta.estado === 'apto' ? 'activo' : atleta.estado === 'no_apto' ? 'inactivo' : 'pendiente',
      ...this.parseObservaciones(atleta.observaciones)
    });
    this.errorMessage = '';
    this.modalOpen = true;
  }

  verAtleta(atleta: AtletaListado): void {
    const atletaId = Number(atleta.id ?? (atleta as AtletaListado & { _id?: number })._id);
    if (!Number.isInteger(atletaId) || atletaId <= 0) {
      this.errorMessage = 'No se pudo identificar el atleta seleccionado.';
      return;
    }

    this.selectedAtleta = { ...atleta, id: atletaId };
  }

  cerrarDetalle(): void {
    this.selectedAtleta = null;
  }

  getDetalleValue(atleta: AtletaListado, key: 'Dirección' | 'Género'): string {
    const value = this.parseObservaciones(atleta.observaciones)[key === 'Dirección' ? 'direccion' : 'genero'];
    return value || 'No informado';
  }

  getEstadoLabel(estado?: string): string {
    if (estado === 'apto') return 'Apto';
    if (estado === 'no_apto') return 'No apto';
    if (estado === 'pendiente') return 'Pendiente';
    return estado || 'Sin estado';
  }

  cerrarModal(): void {
    if (!this.loading) {
      this.modalOpen = false;
      this.isEditMode = false;
      this.currentAtletaId = null;
      this.editingAtleta = null;
    }
  }

  private toDateInputValue(value?: string): string {
    return value ? String(value).slice(0, 10) : '';
  }

  private toNumberOrNull(value?: number | null): number | null {
    return value === undefined || value === null ? null : Number(value);
  }

  private defaultFormValue() {
    return {
      nombre: '', apellido: '', fecha_nacimiento: '', genero: 'Masculino', dni: '',
      email: '', telefono: '', direccion: '', deporte_id: 1, categoria_id: 1,
      fecha_inscripcion: new Date().toISOString().split('T')[0], estado_inicial: 'activo'
    };
  }

  private parseObservaciones(observaciones?: string | null): { direccion?: string; genero?: string } {
    const values: { direccion?: string; genero?: string } = {};
    (observaciones || '').split(' | ').forEach((item) => {
      const [key, ...value] = item.split(': ');
      if (key === 'Dirección') values.direccion = value.join(': ');
      if (key === 'Género') values.genero = value.join(': ');
    });
    return values;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Completa los campos obligatorios antes de registrar el atleta.';
      return;
    }

    this.loading = true;

    const payload = {
      ...this.form.value,
      ...(!this.editingAtleta ? { password: 'Atleta1234!' } : {})
    };

    if (this.isEditMode && this.currentAtletaId === null) {
      this.loading = false;
      this.errorMessage = 'No se pudo identificar el atleta que quieres actualizar.';
      return;
    }

    const request: Observable<RegistrarAtletaResponse | ActualizarAtletaResponse> = this.isEditMode
      ? this.registrarAtletaService.actualizar(this.currentAtletaId as number, payload)
      : this.registrarAtletaService.registrar(payload);

    request.subscribe({
      next: (response: RegistrarAtletaResponse | ActualizarAtletaResponse) => {
        this.loading = false;
        this.successMessage = ('message' in response && response.message) || (this.editingAtleta ? 'Atleta actualizado correctamente.' : 'Atleta registrado correctamente.');
        this.cerrarModal();
        this.cargarAtletas();
      },
      error: (error: { error?: { message?: string } }) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || (this.isEditMode
          ? 'No se pudo actualizar el atleta. Revisá los datos e intentá nuevamente.'
          : 'No se pudo registrar el atleta. Revisá los datos e intentá nuevamente.');
      }
    });
  }

  pedirEliminacion(atleta: AtletaListado): void {
    this.atletaToDelete = atleta;
    this.confirmOpen = true;
  }

  cancelarEliminacion(): void {
    this.confirmOpen = false;
    this.atletaToDelete = null;
  }

  confirmarEliminacion(): void {
    if (!this.atletaToDelete) return;
    const id = this.atletaToDelete.id;
    this.registrarAtletaService.deleteAtleta(id).subscribe({
      next: () => {
        this.successMessage = 'Atleta eliminado correctamente.';
        this.cancelarEliminacion();
        this.cargarAtletas();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar el atleta.';
        this.cancelarEliminacion();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/administrador/home']);
  }
}
