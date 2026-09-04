import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted  = false;
  showPassword = false;
  errorMessage = '';
  loading = false;

  loginBenefits = [
    { icon: 'fa-id-card',        label: 'Gestioná tu membresía en línea' },
    { icon: 'fa-calendar-check', label: 'Reservá instalaciones fácilmente' },
    { icon: 'fa-bell',           label: 'Recibí notificaciones de eventos' },
    { icon: 'fa-trophy',         label: 'Accedé a resultados y estadísticas' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });
  }

  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    if (this.loginForm.invalid) return;

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.loading = false;
        // Redirige al inicio; el header recalculará los links por rol
        this.router.navigate(['/inicio']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message ?? 'Credenciales incorrectas. Por favor intente nuevamente.';
      }
    });
  }

  togglePassword() { this.showPassword = !this.showPassword; }
}
