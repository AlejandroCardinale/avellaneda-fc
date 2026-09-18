import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-nueva-contrasena',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './nueva-contrasena.component.html',
  styleUrl: './nueva-contrasena.component.css'
})
export class NuevaContrasenaComponent implements OnInit {
  form: FormGroup;
  submitted     = false;
  loading       = false;
  exitoso       = false;
  tokenInvalido = false;
  errorMessage  = '';
  showPass      = false;
  showConfirm   = false;
  private token = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      password:  ['', [Validators.required, Validators.minLength(6)]],
      confirmar: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Leer el token de la URL: /nueva-contrasena?token=abc123
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.tokenInvalido = true;
    }
  }

  get f() { return this.form.controls; }

  get noCoinciden(): boolean {
    return this.form.value.password !== this.form.value.confirmar &&
           !!this.form.value.confirmar;
  }

  onSubmit(): void {
    this.submitted    = true;
    this.errorMessage = '';
    if (this.form.invalid || this.noCoinciden) return;

    this.loading = true;

    this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/reset-password`,
      { token: this.token, password: this.form.value.password }
    ).subscribe({
      next: () => {
        this.loading = false;
        this.exitoso = true;
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message ?? '';
        // Si el token es inválido/expirado, mostramos el estado de error
        if (err.status === 400) {
          this.tokenInvalido = true;
        } else {
          this.errorMessage = msg || 'Error al actualizar la contraseña.';
        }
      }
    });
  }
}
