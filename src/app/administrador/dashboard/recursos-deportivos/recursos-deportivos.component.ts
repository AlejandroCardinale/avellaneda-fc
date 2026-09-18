import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import {
  RecursoDeportivo,
  RecursoPayload,
  RecursoEstado,
  RecursosDeportivosService,
  SolicitudAdmin
} from './recursos-deportivos.service';

@Component({
  selector: 'app-recursos-deportivos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './recursos-deportivos.component.html',
  styleUrl: './recursos-deportivos.component.css'
})
export class RecursosDeportivosComponent implements OnInit {
  recursos: RecursoDeportivo[] = [];
  form!: FormGroup;
  editingResource: RecursoDeportivo | null = null;
  modalOpen = false;
  activeTab: 'inventario' | 'solicitudes' = 'inventario';
  solicitudes: SolicitudAdmin[] = [];
  solicitudesLoading = false;
  requestStatus = 'todas';
  listLoading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  search = '';
  categoria = 'todas';
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;
  metrics = { total: 0, equipamiento: 0, indumentaria: 0, transporte: 0 };

  readonly categorias = [
    { value: 'todas', label: 'Todas' },
    { value: 'equipamiento', label: 'Equipamiento' },
    { value: 'indumentaria', label: 'Indumentaria' },
    { value: 'transporte', label: 'Transporte' }
  ];
  readonly estados: { value: RecursoEstado; label: string }[] = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'mantenimiento', label: 'En mantenimiento' },
    { value: 'stock_bajo', label: 'Stock bajo' }
  ];
  readonly solicitudEstados: SolicitudAdmin['estado'][] = ['pendiente', 'aprobada', 'rechazada', 'entregada'];

  constructor(private service: RecursosDeportivosService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      categoria: ['equipamiento', Validators.required],
      descripcion: [''],
      icono: ['fa-box', Validators.required],
      requiere_talle: [false],
      requiere_numero: [false],
      cantidad_disponible: [0, [Validators.required, Validators.min(0)]],
      estado: ['disponible', Validators.required],
      activo: [true]
    });
    this.loadResources();
  }

  loadResources(): void {
    this.listLoading = true;
    this.service.listar({
      search: this.search.trim(),
      categoria: this.categoria,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: (response) => {
        this.recursos = response.data;
        this.total = response.total;
        this.page = response.page;
        this.totalPages = response.totalPages;
        this.metrics = response.metrics;
        this.listLoading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'No se pudo cargar el inventario.';
        this.recursos = [];
        this.listLoading = false;
      }
    });
  }

  onSearch(): void { this.page = 1; this.loadResources(); }

  filterBy(category: string): void {
    this.categoria = category;
    this.page = 1;
    this.loadResources();
  }

  selectTab(tab: 'inventario' | 'solicitudes'): void {
    this.activeTab = tab;
    if (tab === 'solicitudes' && !this.solicitudes.length) this.loadSolicitudes();
  }

  loadSolicitudes(): void {
    this.solicitudesLoading = true;
    this.service.listarSolicitudes().subscribe({
      next: (data) => { this.solicitudes = data; this.solicitudesLoading = false; },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'No se pudieron cargar las solicitudes.';
        this.solicitudesLoading = false;
      }
    });
  }

  get filteredSolicitudes(): SolicitudAdmin[] {
    return this.requestStatus === 'todas' ? this.solicitudes : this.solicitudes.filter(item => item.estado === this.requestStatus);
  }

  changeRequestStatus(request: SolicitudAdmin, estado: SolicitudAdmin['estado']): void {
    this.service.actualizarEstadoSolicitud(request.id, estado).subscribe({
      next: (response) => { this.successMessage = response.message; this.loadSolicitudes(); },
      error: (error) => { this.errorMessage = error?.error?.message || 'No se pudo actualizar la solicitud.'; }
    });
  }

  openNew(): void {
    this.editingResource = null;
    this.form.reset(this.defaultFormValue());
    this.errorMessage = '';
    this.modalOpen = true;
  }

  edit(resource: RecursoDeportivo): void {
    this.editingResource = resource;
    this.errorMessage = '';
    this.successMessage = '';
    this.form.patchValue({
      nombre: resource.nombre,
      categoria: resource.categoria,
      descripcion: resource.descripcion || '',
      icono: resource.icono || 'fa-box',
      requiere_talle: resource.requiere_talle,
      requiere_numero: resource.requiere_numero,
      cantidad_disponible: resource.cantidad_disponible,
      estado: resource.estado,
      activo: resource.activo
    });
    this.modalOpen = true;
  }

  closeEditor(): void {
    this.editingResource = null;
    this.modalOpen = false;
    this.form.reset(this.defaultFormValue());
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const payload = this.form.value as RecursoPayload;
    const request = this.editingResource
      ? this.service.actualizarCompleto(this.editingResource.id, payload)
      : this.service.crear(payload);
    request.subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.saving = false;
        this.closeEditor();
        this.loadResources();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'No se pudo actualizar el recurso.';
      }
    });
  }

  private defaultFormValue(): RecursoPayload {
    return {
      nombre: '', categoria: 'equipamiento', descripcion: '', icono: 'fa-box',
      requiere_talle: false, requiere_numero: false, cantidad_disponible: 0,
      estado: 'disponible', activo: true
    };
  }

  remove(resource: RecursoDeportivo): void {
    if (!confirm(`¿Eliminar “${resource.nombre}” del inventario?`)) return;
    this.service.eliminar(resource.id).subscribe({
      next: (response) => { this.successMessage = response.message; this.loadResources(); },
      error: (error) => { this.errorMessage = error?.error?.message || 'No se pudo eliminar el recurso.'; }
    });
  }

  goToPage(target: number): void {
    if (target < 1 || target > this.totalPages || target === this.page) return;
    this.page = target;
    this.loadResources();
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1).slice(0, 5);
  }

  categoryLabel(category: string): string {
    return this.categorias.find(item => item.value === category)?.label || category;
  }

  statusLabel(status: RecursoEstado): string {
    return this.estados.find(item => item.value === status)?.label || status;
  }

  iconFor(resource: RecursoDeportivo): string {
    if (resource.categoria === 'indumentaria') return '▣';
    if (resource.categoria === 'transporte') return '▰';
    return '⚒';
  }
}
