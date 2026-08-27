import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  showPassword = false;
  errorMessage = '';

  loginBenefits = [
    { icon: 'fa-id-card', label: 'Gestioná tu membresía en línea' },
    { icon: 'fa-calendar-check', label: 'Reservá instalaciones fácilmente' },
    { icon: 'fa-bell', label: 'Recibí notificaciones de eventos' },
    { icon: 'fa-trophy', label: 'Accedé a resultados y estadísticas' }
  ];

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });
  }

  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    if (this.loginForm.valid) {
      this.errorMessage = 'Credenciales incorrectas. Por favor intente nuevamente.';
    }
  }

  togglePassword() { this.showPassword = !this.showPassword; }
}
