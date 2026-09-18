import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">C</div>
          <div>
            <strong>ClubSport</strong>
            <small>Panel Admin</small>
          </div>
        </div>

        <nav class="nav-menu">
          <a routerLink="/administrador/home"             routerLinkActive="active">🏠 Inicio</a>
          <a routerLink="/administrador/usuarios"         routerLinkActive="active">👥 Usuarios</a>
          <a routerLink="/administrador/registrar-atleta" routerLinkActive="active">🏃 Atletas</a>
          <a routerLink="/administrador/entrenadores"     routerLinkActive="active">🧑‍🏫 Entrenadores</a>
          <a routerLink="/administrador/noticias"         routerLinkActive="active">📰 Noticias</a>
          <a routerLink="/administrador/recursos"         routerLinkActive="active">🛠️ Recursos</a>
          <a routerLink="/administrador/solicitudes"      routerLinkActive="active">🧾 Solicitudes</a>
          <a routerLink="/administrador/solicitudes-acceso" routerLinkActive="active" class="nav-item-highlight">
            🔑 Solicitudes de Acceso
            <span class="nav-badge" *ngIf="pendientesCount > 0">{{ pendientesCount }}</span>
          </a>
          <a routerLink="/administrador/reportes"         routerLinkActive="active">📊 Reportes</a>
        </nav>

        <button class="logout-btn" type="button" (click)="logout()">Cerrar Sesión</button>
      </aside>

      <main class="content-area">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      :host { display: block; min-height: 100vh; }
      .admin-shell {
        display: grid;
        grid-template-columns: 250px 1fr;
        min-height: 100vh;
        background: #eef3f8;
        color: #1f2937;
      }
      .sidebar {
        background: linear-gradient(180deg, #0d2d4a 0%, #0e3558 100%);
        color: white;
        padding: 22px 18px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 10px 18px;
        border-bottom: 1px solid rgba(255,255,255,0.14);
      }
      .brand-mark {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #f4f8fb;
        color: #0d2d4a;
        display: grid;
        place-items: center;
        font-weight: 700;
      }
      .brand strong, .brand small { display: block; }
      .brand small { opacity: 0.8; }
      .nav-menu {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .nav-menu a {
        display: flex;
        align-items: center;
        border-radius: 10px;
        padding: 12px 14px;
        color: rgba(255,255,255,0.88);
        text-decoration: none;
        font-weight: 600;
      }
      .nav-menu a.active {
        background: rgba(255,255,255,0.12);
      }
      .logout-btn {
        margin-top: auto;
        border: none;
        background: transparent;
        color: #fff;
        text-align: left;
        padding: 12px 14px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 600;
      }
      .content-area {
        padding: 28px 32px 32px;
      }
      @media (max-width: 960px) {
        .admin-shell { grid-template-columns: 1fr; }
        .sidebar { padding-bottom: 10px; }
      }
      .nav-item-highlight { position: relative; }
      .nav-badge {
        margin-left: auto;
        background: #f59e0b;
        color: #1c1917;
        font-size: 11px;
        font-weight: 800;
        border-radius: 10px;
        padding: 1px 7px;
        min-width: 20px;
        text-align: center;
      }
    `
  ]
})
export class DashboardComponent implements OnInit {
  pendientesCount = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.http.get<{ total: number }>(
      `${environment.apiUrl}/solicitudes-acceso/conteo`
    ).subscribe({
      next: res => { this.pendientesCount = res.total; },
      error: ()  => { this.pendientesCount = 0; }
    });
  }

  logout(): void {
    // clearSession ya se llama dentro de authService.logout()
    this.authService.logout().subscribe({
      next:  () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])   // igual redirige si el backend falla
    });
  }

}
