import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FacilitiesService, Facility } from '../../../services/facilities.service';

@Component({
  selector: 'app-gestion-instalaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './instalaciones.component.html',
  styleUrl: './instalaciones.component.css'
})
export class GestionInstalacionesComponent implements OnInit {
  form!: FormGroup;
  facilities: Facility[] = [];
  selected: Facility | null = null;
  editing: Facility | null = null;
  deleting: Facility | null = null;

  modalOpen = false;
  detailOpen = false;
  confirmOpen = false;
  loading = false;
  listLoading = false;

  search = '';
  selectedTipo = 'todas';
  activo = 'todos';

  errorMessage = '';
  successMessage = '';

  selectedFile: File | null = null;
  imagePreview = '';

  constructor(
    private fb: FormBuilder,
    private facilitiesService: FacilitiesService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(80)]],
      tipo: ['Deportiva', Validators.required],
      capacidad: [100, [Validators.min(0)]],
      icono: ['fa-building', Validators.required],
      horario: ['Lunes a Viernes 8:00 - 22:00'],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      descripcion_larga: [''],
      caracteristicas: [''],
      especificaciones_tecnicas: [''],
      normativas: [''],
      equipamiento: [''],
      activa: [true]
    });

    this.load();
  }

  get f() {
    return this.form.controls;
  }

  get totalCapacity(): number {
    return this.facilities.reduce((total, f) => total + Number(f.capacidad || 0), 0);
  }

  get activeFacilitiesCount(): number {
    return this.facilities.filter(f => f.activa !== false).length;
  }

  load(): void {
    this.listLoading = true;
    this.facilitiesService.listar(this.search.trim(), this.selectedTipo, this.activo).subscribe({
      next: (data) => {
        this.facilities = data;
        this.listLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar instalaciones:', err);
        this.errorMessage = err?.error?.message || 'No se pudieron cargar las instalaciones.';
        this.listLoading = false;
      }
    });
  }

  onSearch(): void {
    this.load();
  }

  openNew(): void {
    this.editing = null;
    this.selectedFile = null;
    this.imagePreview = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.form.reset({
      nombre: '',
      tipo: 'Deportiva',
      capacidad: 100,
      icono: 'fa-building',
      horario: 'Lunes a Viernes 8:00 - 22:00',
      descripcion: '',
      descripcion_larga: '',
      caracteristicas: '',
      especificaciones_tecnicas: '',
      normativas: '',
      equipamiento: '',
      activa: true
    });
    this.modalOpen = true;
  }

  edit(f: Facility): void {
    this.editing = f;
    this.selectedFile = null;
    this.imagePreview = f.image || f.imagen_url || '';
    this.errorMessage = '';
    this.successMessage = '';

    const feats = Array.isArray(f.features)
      ? f.features.join('\n')
      : (Array.isArray(f.caracteristicas) ? f.caracteristicas.join('\n') : '');

    const specs = Array.isArray(f.technicalSpecs)
      ? f.technicalSpecs.map(s => `${s.key}: ${s.value}`).join('\n')
      : (Array.isArray(f.especificaciones_tecnicas)
          ? f.especificaciones_tecnicas.map(s => `${s.key}: ${s.value}`).join('\n')
          : '');

    const norms = Array.isArray(f.regulations)
      ? f.regulations.join('\n')
      : (Array.isArray(f.normativas) ? f.normativas.join('\n') : '');

    const equips = Array.isArray(f.equipment)
      ? f.equipment.join('\n')
      : (Array.isArray(f.equipamiento) ? f.equipamiento.join('\n') : '');

    this.form.patchValue({
      nombre: f.name || f.nombre,
      tipo: f.label || f.tipo || 'Deportiva',
      capacidad: f.capacidad || 0,
      icono: f.icon || f.icono || 'fa-building',
      horario: f.schedule || f.horario || '',
      descripcion: f.description || f.descripcion || '',
      descripcion_larga: f.longDescription || f.descripcion_larga || '',
      caracteristicas: feats,
      especificaciones_tecnicas: specs,
      normativas: norms,
      equipamiento: equips,
      activa: f.activa !== false
    });

    this.modalOpen = true;
  }

  view(f: Facility): void {
    this.selected = f;
    this.detailOpen = true;
  }

  closeDetail(): void {
    this.selected = null;
    this.detailOpen = false;
  }

  askDelete(f: Facility): void {
    this.deleting = f;
    this.confirmOpen = true;
  }

  cancelDelete(): void {
    this.deleting = null;
    this.confirmOpen = false;
  }

  confirmDelete(): void {
    if (!this.deleting) return;
    this.facilitiesService.eliminar(this.deleting.id).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Instalación desactivada con éxito.';
        this.cancelDelete();
        this.load();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'No se pudo desactivar la instalación.';
        this.cancelDelete();
      }
    });
  }

  closeModal(): void {
    if (!this.loading) {
      this.modalOpen = false;
      this.editing = null;
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = String(reader.result || ''));
    reader.readAsDataURL(this.selectedFile);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const val = this.form.value;
    const payload = new FormData();

    payload.append('nombre', val.nombre || '');
    payload.append('tipo', val.tipo || 'Deportiva');
    payload.append('capacidad', String(val.capacidad || 0));
    payload.append('icono', val.icono || 'fa-building');
    payload.append('horario', val.horario || '');
    payload.append('descripcion', val.descripcion || '');
    payload.append('descripcion_larga', val.descripcion_larga || val.descripcion || '');
    payload.append('activa', String(val.activa));

    const featsArray = val.caracteristicas
      ? val.caracteristicas.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : [];
    payload.append('caracteristicas', JSON.stringify(featsArray));

    const specsArray = val.especificaciones_tecnicas
      ? val.especificaciones_tecnicas.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : [];
    payload.append('especificaciones_tecnicas', JSON.stringify(specsArray));

    const normsArray = val.normativas
      ? val.normativas.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : [];
    payload.append('normativas', JSON.stringify(normsArray));

    const equipsArray = val.equipamiento
      ? val.equipamiento.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : [];
    payload.append('equipamiento', JSON.stringify(equipsArray));

    if (this.selectedFile) {
      payload.append('imagen', this.selectedFile, this.selectedFile.name);
    }

    const request = this.editing
      ? this.facilitiesService.actualizar(this.editing.id, payload)
      : this.facilitiesService.crear(payload);

    request.subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message || 'Instalación guardada exitosamente.';
        this.closeModal();
        this.load();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'No se pudo guardar la instalación.';
      }
    });
  }
}

export { GestionInstalacionesComponent as InstalacionesAdminComponent };
