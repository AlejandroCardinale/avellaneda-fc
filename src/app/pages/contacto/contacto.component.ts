import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './contacto.component.html',
  styleUrl: './contacto.component.css'
})
export class ContactoComponent {
  contactForm: FormGroup;
  submitted    = false;
  success      = false;
  loading      = false;
  errorMessage = '';

  socialLinks = [
    { icon: 'fa-brands fa-instagram', label: 'Instagram', url: '#', color: '#e1306c' },
    { icon: 'fa-brands fa-facebook-f', label: 'Facebook', url: '#', color: '#1877f2' },
    { icon: 'fa-brands fa-youtube', label: 'YouTube', url: '#', color: '#ff0000' },
    { icon: 'fa-brands fa-x-twitter', label: 'Twitter/X', url: '#', color: '#000' }
  ];

  benefits = [
    { icon: 'fa-headset', label: 'Atención personalizada' },
    { icon: 'fa-handshake', label: 'Compromiso' },
    { icon: 'fa-location-dot', label: 'Cerca de vos' },
    { icon: 'fa-star', label: 'Tu opinión importa' }
  ];

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.contactForm = this.fb.group({
      nombre:  ['', [Validators.required, Validators.minLength(2)]],
      email:   ['', [Validators.required, Validators.email]],
      telefono:[''],
      asunto:  ['', Validators.required],
      mensaje: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  get f() { return this.contactForm.controls; }

  onSubmit(): void {
    this.submitted    = true;
    this.errorMessage = '';
    if (this.contactForm.invalid) return;

    this.loading = true;

    this.http.post<{ message: string }>(
      `${environment.apiUrl}/contacto`,
      this.contactForm.value
    ).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.contactForm.reset();
        this.submitted = false;
      },
      error: (err) => {
        this.loading      = false;
        this.errorMessage = err.error?.message ?? 'Error al enviar el mensaje. Intentá más tarde.';
      }
    });
  }
}

