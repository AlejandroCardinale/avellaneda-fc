import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { GestionNoticiasService, Noticia, NoticiaEstado } from './gestion-noticias.service';

@Component({
  selector: 'app-gestion-noticias',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './gestion-noticias.component.html',
  styleUrl: './gestion-noticias.component.css'
})
export class GestionNoticiasComponent implements OnInit {
  form!: FormGroup;
  noticias: Noticia[] = [];
  editingId: number | null = null;
  modalOpen = false;
  selectedFile: File | null = null;
  imagePreview = '';
  loading = false;
  listLoading = false;
  errorMessage = '';
  successMessage = '';
  search = '';
  status = 'todas';
  order = 'recent';
  page = 1;
  pageSize = 6;
  total = 0;
  totalPages = 1;
  metrics = { publicadas: 0, borradores: 0, programadas: 0 };
  readonly categorias = ['Eventos', 'Instalaciones', 'Atletas', 'Comunicados', 'Deportes', 'Institucional'];
  readonly estados: { value: NoticiaEstado; label: string }[] = [
    { value: 'publicada', label: 'Publicada' },
    { value: 'borrador', label: 'Borrador' },
    { value: 'programada', label: 'Programada' }
  ];

  constructor(private fb: FormBuilder, private service: GestionNoticiasService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(160)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      categoria: ['Comunicados', Validators.required],
      imagen_url: [''],
      estado: ['borrador', Validators.required],
      fecha_publicacion: [this.toLocalDateTime(new Date())]
    });
    this.loadNews();
  }

  get f() { return this.form.controls; }

  loadNews(): void {
    this.listLoading = true;
    this.service.listar({ search: this.search.trim(), status: this.status, page: this.page, pageSize: this.pageSize, order: this.order }).subscribe({
      next: (response) => {
        this.noticias = response.data;
        this.total = response.total;
        this.page = response.page;
        this.totalPages = response.totalPages;
        this.metrics = response.metrics;
        this.listLoading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'No se pudieron cargar las noticias.';
        this.noticias = [];
        this.listLoading = false;
      }
    });
  }

  onSearch(): void { this.page = 1; this.loadNews(); }
  onStatusChange(status: string): void { this.status = status; this.page = 1; this.loadNews(); }
  onOrderChange(order: string): void { this.order = order; this.page = 1; this.loadNews(); }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Completa los campos obligatorios antes de guardar.';
      return;
    }

    this.loading = true;
    const payload = new FormData();
    Object.entries(this.form.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined) payload.append(key, String(value));
    });
    if (this.selectedFile) payload.append('imagen', this.selectedFile, this.selectedFile.name);

    const request = this.editingId
      ? this.service.actualizar(this.editingId, payload)
      : this.service.crear(payload);
    request.subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loading = false;
        this.cerrarModal();
        this.loadNews();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'No se pudo guardar la noticia.';
      }
    });
  }

  editar(noticia: Noticia): void {
    this.editingId = noticia.id;
    this.selectedFile = null;
    this.imagePreview = noticia.imagen_url || '';
    this.errorMessage = '';
    this.successMessage = '';
    this.form.patchValue({
      titulo: noticia.titulo,
      descripcion: noticia.descripcion,
      categoria: noticia.categoria,
      imagen_url: noticia.imagen_url || '',
      estado: noticia.estado,
      fecha_publicacion: this.toLocalDateTime(new Date(noticia.fecha_publicacion))
    });
    this.modalOpen = true;
  }

  abrirNuevo(): void {
    this.resetForm();
    this.errorMessage = '';
    this.modalOpen = true;
  }

  cerrarModal(): void {
    if (this.loading) return;
    this.modalOpen = false;
    this.resetForm();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.imagePreview = String(reader.result || '');
    reader.readAsDataURL(file);
  }

  ver(noticia: Noticia): void {
    this.successMessage = `${noticia.titulo}: ${noticia.descripcion}`;
    this.errorMessage = '';
  }

  eliminar(noticia: Noticia): void {
    if (!confirm(`¿Eliminar “${noticia.titulo}”?`)) return;
    this.service.eliminar(noticia.id).subscribe({
      next: (response) => { this.successMessage = response.message; this.loadNews(); },
      error: (error) => { this.errorMessage = error?.error?.message || 'No se pudo eliminar la noticia.'; }
    });
  }

  goToPage(target: number): void {
    if (target < 1 || target > this.totalPages || target === this.page) return;
    this.page = target;
    this.loadNews();
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1).slice(0, 5);
  }

  resetForm(): void {
    this.editingId = null;
    this.selectedFile = null;
    this.imagePreview = '';
    this.form.reset({
      titulo: '', descripcion: '', categoria: 'Comunicados', imagen_url: '',
      estado: 'borrador', fecha_publicacion: this.toLocalDateTime(new Date())
    });
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  }

  private toLocalDateTime(date: Date): string {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }
}
