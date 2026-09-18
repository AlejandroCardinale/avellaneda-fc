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
      nombre: ['', [Validators.required, Validators.maxLength(60)]],
      categoria: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      icono: ['fa-futbol', Validators.required],
      activo: [true]
    });
    this.load();
  }

  get f() { return this.form.controls; }

  get totalAthletes(): number { return this.deportes.reduce((total, sport) => total + Number(sport.atletas || 0), 0); }
  get totalCoaches(): number { return this.deportes.reduce((total, sport) => total + Number(sport.entrenadores || 0), 0); }

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
    this.form.reset({ nombre: '', categoria: '', descripcion: '', icono: 'fa-futbol', activo: true });
    this.errorMessage = '';
    this.modalOpen = true;
  }

  edit(sport: Deporte): void {
    this.editing = sport;
    this.selectedFile = null;
    this.imagePreview = sport.imagen_url || '';
    this.form.patchValue({ nombre: sport.nombre, categoria: sport.categoria || '', descripcion: sport.descripcion, icono: sport.icono, activo: sport.activo });
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
    const payload = new FormData();
    Object.entries(this.form.value).forEach(([key, value]) => payload.append(key, String(value ?? '')));
    if (this.selectedFile) payload.append('imagen', this.selectedFile, this.selectedFile.name);
    const request = this.editing ? this.service.actualizar(this.editing.id, payload) : this.service.crear(payload);
    request.subscribe({
      next: response => { this.loading = false; this.successMessage = response.message; this.closeModal(); this.load(); },
      error: error => { this.loading = false; this.errorMessage = error?.error?.message || 'No se pudo guardar el deporte.'; }
    });
  }
}
