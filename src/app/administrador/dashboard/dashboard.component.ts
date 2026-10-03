import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
          <a routerLink="/administrador/home" routerLinkActive="active" ariaCurrentWhenActive="page"><i class="fa-solid fa-house" aria-hidden="true"></i><span>Inicio</span></a>
          <a routerLink="/administrador/usuarios" routerLinkActive="active" ariaCurrentWhenActive="page"><i class="fa-solid fa-users" aria-hidden="true"></i><span>Usuarios</span></a>
          <a routerLink="/administrador/registrar-atleta" routerLinkActive="active" ariaCurrentWhenActive="page"><i class="fa-solid fa-person-running" aria-hidden="true"></i><span>Atletas</span></a>
          <a routerLink="/administrador/entrenadores" routerLinkActive="active" ariaCurrentWhenActive="page"><i class="fa-solid fa-clipboard-user" aria-hidden="true"></i><span>Entrenadores</span></a>
          <a routerLink="/administrador/deportes" routerLinkActive="active" ariaCurrentWhenActive="page"><i class="fa-solid fa-trophy" aria-hidden="true"></i><span>Deportes</span></a>
          <a routerLink="/administrador/noticias" routerLinkActive="active" ariaCurrentWhenActive="page"><i class="fa-solid fa-newspaper" aria-hidden="true"></i><span>Noticias</span></a>
          <a routerLink="/administrador/recursos" routerLinkActive="active" ariaCurrentWhenActive="page"><i class="fa-solid fa-dumbbell" aria-hidden="true"></i><span>Recursos Deportivos</span></a>
          <a routerLink="/administrador/solicitudes" routerLinkActive="active" ariaCurrentWhenActive="page"><i class="fa-solid fa-file-circle-check" aria-hidden="true"></i><span>Solicitudes</span></a>
          <a routerLink="/administrador/reportes" routerLinkActive="active" ariaCurrentWhenActive="page"><i class="fa-solid fa-chart-column" aria-hidden="true"></i><span>Reportes</span></a>
        </nav>

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
        position: relative;
        display: flex;
        align-items: center;
        gap: 13px;
        min-height: 46px;
        border: 1px solid transparent;
        border-radius: 9px;
        padding: 10px 13px;
        color: rgba(255,255,255,0.88);
        text-decoration: none;
        font-weight: 600;
        transition: all 200ms ease;
      }
      .nav-menu a i {
        display: grid;
        place-items: center;
        width: 20px;
        flex: 0 0 20px;
        color: #9bb7ce;
        font-size: 15px;
        transition: color 200ms ease, transform 200ms ease;
      }
      .nav-menu a:hover {
        transform: translateX(4px);
        border-color: rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.09);
        color: #fff;
      }
      .nav-menu a:hover i {
        transform: scale(1.08);
        color: #d7eaff;
      }
      .nav-menu a.active {
        border-color: rgba(147,197,253,0.18);
        background: linear-gradient(100deg, rgba(59,130,246,0.32), rgba(59,130,246,0.12));
        color: #fff;
        box-shadow: inset 3px 0 0 #60a5fa, 0 5px 16px rgba(2,12,27,0.16);
      }
      .nav-menu a.active i {
        color: #bfdbfe;
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<{ total: number }>(
      `${environment.apiUrl}/solicitudes-acceso/conteo`
    ).subscribe({
      next: res => { this.pendientesCount = res.total; },
      error: ()  => { this.pendientesCount = 0; }
    });
  }
}
