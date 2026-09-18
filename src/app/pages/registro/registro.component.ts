import { Component } from '@angular/core';
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
export class RegistroComponent {
  form: FormGroup;
  submitted       = false;
  loading         = false;
  errorMessage    = '';
  registroExitoso = false;   // true cuando la solicitud fue enviada
  showPassword    = false;
  showConfirm     = false;

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
      rol:             ['atleta', Validators.required],   // atleta por defecto
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatch });
  }

  get f() { return this.form.controls; }
  get passwordsMismatch() {
    return this.submitted && this.form.hasError('passwordsMismatch');
  }

  onSubmit() {
    this.submitted     = true;
    this.errorMessage  = '';
    if (this.form.invalid) return;

    this.loading = true;
    const { nombre, apellido, email, password, telefono, rol } = this.form.value;
    const data: RegisterRequest = { nombre, apellido, email, password, telefono: telefono || undefined, rol };

    this.authService.register(data).subscribe({
      next: () => {
        this.loading         = false;
        this.registroExitoso = true;   // Muestra el mensaje de "solicitud pendiente"
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
