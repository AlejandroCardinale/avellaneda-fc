import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AtletaListado, RegistrarAtletaService } from './registrar-atleta.service';

@Component({
  selector: 'app-registrar-atleta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registrar-atleta.component.html',
  styleUrl: './registrar-atleta.component.css'
})
export class RegistrarAtletaComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  athletesLoading = false;
  errorMessage = '';
  successMessage = '';
  atletas: AtletaListado[] = [];

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
    { id: 5, nombre: 'Juvenil' },
    { id: 6, nombre: 'Adultos' },
    { id: 7, nombre: 'Mujeres' },
    { id: 8, nombre: 'Varones' }
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
      password: 'Atleta1234!'
    };

    this.registrarAtletaService.registrar(payload).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response?.message || 'Atleta registrado correctamente.';
        this.form.reset({
          genero: 'Masculino',
          deporte_id: 1,
          categoria_id: 1,
          fecha_inscripcion: new Date().toISOString().split('T')[0],
          estado_inicial: 'activo'
        });
        this.cargarAtletas();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'No se pudo registrar el atleta. Revisá los datos e intentá nuevamente.';
      }
    });
  }

  eliminarAtleta(id: number): void {
    if (!confirm('¿Eliminar este atleta?')) return;

    this.registrarAtletaService.deleteAtleta(id).subscribe({
      next: () => {
        this.successMessage = 'Atleta eliminado correctamente.';
        this.cargarAtletas();
      },
      error: () => {
        this.errorMessage = 'No se pudo eliminar el atleta.';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/administrador/home']);
  }
}
