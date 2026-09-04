import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Entrenador, EntrenadoresService } from './entrenadores.service';

@Component({
  selector: 'app-entrenadores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './entrenadores.component.html',
  styleUrls: ['./entrenadores.component.css']
})
export class EntrenadoresComponent implements OnInit {
  form!: FormGroup;
  entrenadores: Entrenador[] = [];
  editingId: number | null = null;
  loading = false;
  listLoading = false;
  errorMessage = '';
  successMessage = '';

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

  private crearFormulario(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.minLength(7)]],
      deporte_id: [1, Validators.required],
      especialidad: ['', [Validators.required, Validators.minLength(3)]],
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

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Completa los campos obligatorios antes de guardar.';
      return;
    }

    this.loading = true;
    const request = this.editingId
      ? this.entrenadoresService.actualizar(this.editingId, this.form.value)
      : this.entrenadoresService.registrar(this.form.value);

    request.subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.message;
        this.resetForm();
        this.cargarEntrenadores();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'No se pudo guardar el entrenador.';
      }
    });
  }

  editar(entrenador: Entrenador): void {
    this.editingId = entrenador.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.form.patchValue({
      nombre: entrenador.nombre,
      apellido: entrenador.apellido,
      email: entrenador.email,
      telefono: entrenador.telefono || '',
      deporte_id: entrenador.deporte_id || 1,
      especialidad: entrenador.especialidad || '',
      estado_inicial: entrenador.estado
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ver(entrenador: Entrenador): void {
    this.successMessage = `${entrenador.nombre} ${entrenador.apellido}: ${entrenador.especialidad || 'Sin especialidad'} - ${entrenador.deporte || 'Sin disciplina'}.`;
    this.errorMessage = '';
  }

  eliminar(entrenador: Entrenador): void {
    if (!confirm(`¿Eliminar a ${entrenador.nombre} ${entrenador.apellido}?`)) return;

    this.entrenadoresService.eliminar(entrenador.id).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.cargarEntrenadores();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'No se pudo eliminar el entrenador.';
      }
    });
  }

  cancelarEdicion(): void {
    this.resetForm();
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
      estado_inicial: 'activo'
    });
  }
}
