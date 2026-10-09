import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService, RegisterRequest } from '../../services/auth.service';

// Validador: confirmar contraseña
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass    = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit {
  form: FormGroup;
  submitted       = false;
  loading         = false;
  errorMessage    = '';
  registroExitoso = false; // true cuando la solicitud fue enviada
  showPassword    = false;
  showConfirm     = false;

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

  todasLasCategorias = [
    { id: 1, deporte_id: 1, nombre: 'Infantil' },
    { id: 2, deporte_id: 1, nombre: 'Sub-15' },
    { id: 3, deporte_id: 1, nombre: 'Sub-17' },
    { id: 4, deporte_id: 1, nombre: 'Primera División' },
    { id: 5, deporte_id: 2, nombre: 'Bebés' },
    { id: 6, deporte_id: 2, nombre: 'Niños' },
    { id: 7, deporte_id: 2, nombre: 'Adultos' },
    { id: 8, deporte_id: 3, nombre: 'Singles' },
    { id: 9, deporte_id: 3, nombre: 'Dobles' },
    { id: 19, deporte_id: 4, nombre: 'Musculación' },
    { id: 20, deporte_id: 4, nombre: 'Cardio y Fitness' },
    { id: 10, deporte_id: 5, nombre: 'Sub-15' },
    { id: 11, deporte_id: 5, nombre: 'Sub-17' },
    { id: 12, deporte_id: 5, nombre: 'Primera Masculino' },
    { id: 13, deporte_id: 5, nombre: 'Primera Femenino' },
    { id: 14, deporte_id: 6, nombre: 'Masculino' },
    { id: 15, deporte_id: 6, nombre: 'Femenino' },
    { id: 21, deporte_id: 7, nombre: 'Velocidad y Pista' },
    { id: 22, deporte_id: 7, nombre: 'Fondo y Medio Fondo' },
    { id: 16, deporte_id: 8, nombre: 'Judo' },
    { id: 17, deporte_id: 8, nombre: 'Karate' },
    { id: 18, deporte_id: 8, nombre: 'Taekwondo' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      nombre:          ['', [Validators.required, Validators.minLength(2)]],
      apellido:        ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      telefono:        [''],
      rol:             ['atleta', Validators.required],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],

      // Campos específicos de Atleta (Simplificado: Deporte, Categoría y DNI)
      deporte_id:      [1],
      categoria_id:    [1],
      dni:             [''],

      // Campos específicos de Entrenador
      especialidad:    [''],
      licencia:        ['']
    }, { validators: passwordsMatch });
  }

  ngOnInit(): void {
    this.actualizarValidadoresSegunRol(this.form.get('rol')?.value);

    this.form.get('rol')?.valueChanges.subscribe(rol => {
      this.actualizarValidadoresSegunRol(rol);
    });

    this.form.get('deporte_id')?.valueChanges.subscribe(deporteId => {
      this.onDeporteChange(Number(deporteId));
    });
  }

  get f() { return this.form.controls; }
  get rolSeleccionado(): string { return this.form.get('rol')?.value; }
  get passwordsMismatch() {
    return this.submitted && this.form.hasError('passwordsMismatch');
  }

  get categoriasFiltradas() {
    const depId = Number(this.form.get('deporte_id')?.value || 1);
    const filtradas = this.todasLasCategorias.filter(c => c.deporte_id === depId);
    return filtradas.length ? filtradas : [{ id: 0, deporte_id: depId, nombre: 'General' }];
  }

  onDeporteChange(deporteId: number): void {
    const categorias = this.todasLasCategorias.filter(c => c.deporte_id === deporteId);
    if (categorias.length > 0) {
      const currentCat = Number(this.form.get('categoria_id')?.value);
      if (!categorias.some(c => c.id === currentCat)) {
        this.form.patchValue({ categoria_id: categorias[0].id });
      }
    } else {
      this.form.patchValue({ categoria_id: null });
    }
  }

  setRol(rol: string): void {
    this.form.patchValue({ rol });
  }

  private actualizarValidadoresSegunRol(rol: string): void {
    const deporteCtrl      = this.form.get('deporte_id');
    const categoriaCtrl    = this.form.get('categoria_id');
    const dniCtrl          = this.form.get('dni');
    const especialidadCtrl = this.form.get('especialidad');

    if (rol === 'atleta') {
      deporteCtrl?.setValidators([Validators.required]);
      categoriaCtrl?.setValidators([]);
      dniCtrl?.setValidators([Validators.required, Validators.minLength(6)]);
      especialidadCtrl?.clearValidators();
    } else if (rol === 'entrenador') {
      deporteCtrl?.setValidators([Validators.required]);
      especialidadCtrl?.setValidators([Validators.required, Validators.minLength(3)]);
      categoriaCtrl?.clearValidators();
      dniCtrl?.clearValidators();
    } else {
      // Administrador: no requiere campos extra
      deporteCtrl?.clearValidators();
      categoriaCtrl?.clearValidators();
      dniCtrl?.clearValidators();
      especialidadCtrl?.clearValidators();
    }

    deporteCtrl?.updateValueAndValidity();
    categoriaCtrl?.updateValueAndValidity();
    dniCtrl?.updateValueAndValidity();
    especialidadCtrl?.updateValueAndValidity();
  }

  onSubmit(): void {
    this.submitted    = true;
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const v = this.form.value;

    const data: RegisterRequest = {
      nombre:   v.nombre.trim(),
      apellido: v.apellido.trim(),
      email:    v.email.trim(),
      password: v.password,
      telefono: v.telefono ? String(v.telefono).trim() : undefined,
      rol:      v.rol
    };

    if (v.rol === 'atleta') {
      data.deporte_id   = Number(v.deporte_id);
      data.categoria_id = v.categoria_id ? Number(v.categoria_id) : null;
      data.dni          = v.dni ? String(v.dni).trim() : undefined;
    } else if (v.rol === 'entrenador') {
      data.deporte_id   = Number(v.deporte_id);
      data.especialidad = v.especialidad ? String(v.especialidad).trim() : undefined;
      data.licencia     = v.licencia ? String(v.licencia).trim() : undefined;
    }

    this.authService.register(data).subscribe({
      next: () => {
        this.loading         = false;
        this.registroExitoso = true; // Muestra el mensaje de solicitud pendiente
      },
      error: (err) => {
        this.loading      = false;
        this.errorMessage = err?.error?.message ?? 'Error al registrarse. Intentá nuevamente.';
      }
    });
  }

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirm()  { this.showConfirm  = !this.showConfirm; }
}
