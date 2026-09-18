import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './recuperar-contrasena.component.html',
  styleUrl: './recuperar-contrasena.component.css'
})
export class RecuperarContrasenaComponent {
  form: FormGroup;
  submitted  = false;
  loading    = false;
  enviado    = false;
  errorMessage = '';
  emailIngresado = '';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
    this.submitted    = true;
    this.errorMessage = '';
    if (this.form.invalid) return;

    this.loading        = true;
    this.emailIngresado = this.form.value.email;

    this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/forgot-password`,
      { email: this.emailIngresado }
    ).subscribe({
      next: () => {
        this.loading = false;
        this.enviado = true;
      },
      error: (err) => {
        this.loading      = false;
        this.errorMessage = err.error?.message ?? 'Error al enviar el email. Intentá más tarde.';
      }
    });
  }
}
