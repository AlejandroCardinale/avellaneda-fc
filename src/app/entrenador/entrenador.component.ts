import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-entrenador',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './entrenador-layout.component.html',
  styleUrl: './entrenador-layout.component.css'
})
export class EntrenadorComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login']);
    } else if (!this.authService.isEntrenador()) {
      void this.router.navigate([this.authService.isAdmin() ? '/administrador' : '/inicio']);
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => void this.router.navigate(['/login'])
    });
  }
}
