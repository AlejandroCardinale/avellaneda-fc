import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DeportesAdminService, Deporte } from './deportes.service';

@Component({
  selector: 'app-deportes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './deportes.component.html',
  styleUrl: './deportes.component.css'
})
export class DeportesAdminComponent implements OnInit {
  form!: FormGroup;
  deportes: Deporte[] = [];
  selected: Deporte | null = null;
  editing: Deporte | null = null;
  deleting: Deporte | null = null;
  modalOpen = false;
  detailOpen = false;
  confirmOpen = false;
  loading = false;
  listLoading = false;
  search = '';
  activo = 'true';
  errorMessage = '';
  successMessage = '';
  selectedFile: File | null = null;
  imagePreview = '';

  constructor(private fb: FormBuilder, private service: DeportesAdminService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(80)]],
      tipo: ['Deportes', Validators.required],
      categoria: ['Deportes de equipo', Validators.required],
      capacidad: [0, [Validators.min(0)]],
      icono: ['fa-futbol', Validators.required],
      horario: [''],
      atletas: [0, [Validators.min(0)]],
      entrenadores: [0, [Validators.min(0)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      descripcion_larga: [''],
      caracteristicas: [''],
      categorias: [''],
      especificaciones_tecnicas: [''],
      equipamiento: [''],
      normativas: [''],
      activo: [true]
    });
    this.load();
  }

  get f() { return this.form.controls; }

  get totalAthletes(): number { return this.deportes.reduce((total, sport) => total + Number(sport.atletas || sport.atletas_count || 0), 0); }
  get totalCoaches(): number { return this.deportes.reduce((total, sport) => total + Number(sport.entrenadores || sport.entrenadores_count || 0), 0); }

  load(): void {
    this.listLoading = true;
    this.service.listar(this.search.trim(), this.activo).subscribe({
      next: response => { this.deportes = response.data; this.listLoading = false; },
      error: error => { this.errorMessage = error?.error?.message || 'No se pudieron cargar los deportes.'; this.listLoading = false; }
    });
  }

  onSearch(): void { this.load(); }

  openNew(): void {
    this.editing = null;
    this.selectedFile = null;
    this.imagePreview = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.form.reset({
      nombre: '',
      tipo: 'Deportes',
      categoria: 'Deportes de equipo',
      capacidad: 0,
      icono: 'fa-futbol',
      horario: 'Lunes a Viernes 17:00 - 21:00',
      atletas: 0,
      entrenadores: 0,
      descripcion: '',
      descripcion_larga: '',
      caracteristicas: '',
      categorias: '',
      especificaciones_tecnicas: '',
      equipamiento: '',
      normativas: '',
      activo: true
    });
    this.modalOpen = true;
  }

  edit(sport: Deporte): void {
    this.editing = sport;
    this.selectedFile = null;
    this.imagePreview = sport.imagen_url || sport.image || '';
    this.errorMessage = '';
    this.successMessage = '';

    const feats = Array.isArray(sport.features)
      ? sport.features.join('\n')
      : (Array.isArray(sport.caracteristicas) ? sport.caracteristicas.join('\n') : '');

    const cats = Array.isArray(sport.categories)
      ? sport.categories.join('\n')
      : (Array.isArray(sport.categorias) ? sport.categorias.join('\n') : (sport.categoria || ''));

    const specs = Array.isArray(sport.technicalSpecs)
      ? sport.technicalSpecs.map(s => `${s.key}: ${s.value}`).join('\n')
      : (Array.isArray(sport.especificaciones_tecnicas)
          ? sport.especificaciones_tecnicas.map(s => `${s.key}: ${s.value}`).join('\n')
          : '');

    const equips = Array.isArray(sport.equipment)
      ? sport.equipment.join('\n')
      : (Array.isArray(sport.equipamiento) ? sport.equipamiento.join('\n') : '');

    const norms = Array.isArray(sport.regulations)
      ? sport.regulations.join('\n')
      : (Array.isArray(sport.normativas) ? sport.normativas.join('\n') : '');

    this.form.patchValue({
      nombre: sport.nombre || sport.name,
      tipo: sport.tipo || 'Deportes',
      categoria: sport.categoria || (Array.isArray(sport.categories) && sport.categories.length ? sport.categories[0] : 'General'),
      capacidad: sport.capacidad || 0,
      icono: sport.icono || sport.icon || 'fa-futbol',
      horario: sport.horario || sport.schedule || '',
      atletas: sport.atletas ?? sport.atletas_count ?? 0,
      entrenadores: sport.entrenadores ?? sport.entrenadores_count ?? 0,
      descripcion: sport.descripcion || sport.description || '',
      descripcion_larga: sport.descripcion_larga || sport.longDescription || sport.descripcion || '',
      caracteristicas: feats,
      categorias: cats,
      especificaciones_tecnicas: specs,
      equipamiento: equips,
      normativas: norms,
      activo: sport.activo !== false
    });
    this.modalOpen = true;
  }

  view(sport: Deporte): void { this.selected = sport; this.detailOpen = true; }
  closeDetail(): void { this.selected = null; this.detailOpen = false; }

  askDelete(sport: Deporte): void { this.deleting = sport; this.confirmOpen = true; }
  cancelDelete(): void { this.deleting = null; this.confirmOpen = false; }
  confirmDelete(): void {
    if (!this.deleting) return;
    this.service.eliminar(this.deleting.id).subscribe({
      next: response => { this.successMessage = response.message; this.cancelDelete(); this.load(); },
      error: error => { this.errorMessage = error?.error?.message || 'No se pudo eliminar el deporte.'; this.cancelDelete(); }
    });
  }

  closeModal(): void { if (!this.loading) { this.modalOpen = false; this.editing = null; } }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
    if (!this.selectedFile) return;
    const reader = new FileReader();
    reader.onload = () => this.imagePreview = String(reader.result || '');
    reader.readAsDataURL(this.selectedFile);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const val = this.form.value;
    const payload = new FormData();

    payload.append('nombre', val.nombre || '');
    payload.append('tipo', val.tipo || 'Deportes');
    payload.append('categoria', val.categoria || '');
    payload.append('capacidad', String(val.capacidad || 0));
    payload.append('icono', val.icono || 'fa-futbol');
    payload.append('horario', val.horario || '');
    payload.append('atletas', String(val.atletas || 0));
    payload.append('entrenadores', String(val.entrenadores || 0));
    payload.append('descripcion', val.descripcion || '');
    payload.append('descripcion_larga', val.descripcion_larga || val.descripcion || '');
    payload.append('activo', String(val.activo));

    const featsArray = val.caracteristicas
      ? val.caracteristicas.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : [];
    payload.append('caracteristicas', JSON.stringify(featsArray));

    const catsArray = val.categorias
      ? val.categorias.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : [];
    payload.append('categorias', JSON.stringify(catsArray));

    const specsArray = val.especificaciones_tecnicas
      ? val.especificaciones_tecnicas.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : [];
    payload.append('especificaciones_tecnicas', JSON.stringify(specsArray));

    const equipsArray = val.equipamiento
      ? val.equipamiento.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : [];
    payload.append('equipamiento', JSON.stringify(equipsArray));

    const normsArray = val.normativas
      ? val.normativas.split('\n').map((s: string) => s.trim()).filter(Boolean)
      : [];
    payload.append('normativas', JSON.stringify(normsArray));

    if (this.selectedFile) {
      payload.append('imagen', this.selectedFile, this.selectedFile.name);
    }

    const request = this.editing ? this.service.actualizar(this.editing.id, payload) : this.service.crear(payload);
    request.subscribe({
      next: response => { this.loading = false; this.successMessage = response.message; this.closeModal(); this.load(); },
      error: error => { this.loading = false; this.errorMessage = error?.error?.message || 'No se pudo guardar el deporte.'; }
    });
  }
}
