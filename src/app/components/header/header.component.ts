import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  mobileMenuOpen = false;
  scrolled = false;

  private readonly BASE_LINKS = [
    { label: 'Inicio',         path: '/inicio' },
    { label: 'Noticias',       path: '/noticias' },
    { label: 'Deportes',       path: '/deportes' },
    { label: 'Instalaciones',  path: '/instalaciones' },
    { label: 'Eventos',        path: '/eventos' },
    { label: 'Contacto',       path: '/contacto' }
  ];

  navLinks: { label: string; path: string }[] = [];
  isLoggedIn = false;
  usuarioNombre = '';
  private sub = new Subscription();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.buildNavLinks();
    // Recalcula los links en cada navegación (tras login/logout)
    this.sub.add(
      this.router.events.subscribe(event => {
        if (event.constructor.name === 'NavigationEnd') {
          this.buildNavLinks();
        }
      })
    );
  }

  buildNavLinks() {
    this.isLoggedIn  = this.authService.isLoggedIn();
    const usuario    = this.authService.getUsuario();
    this.usuarioNombre = usuario ? usuario.nombre : '';

    // Siempre cargamos los links base
    const links = [...this.BASE_LINKS];

    // Entrenador o Admin: agrega Solicitud
    if (this.authService.isEntrenador() || this.authService.isAdmin()) {
      links.push({ label: 'Solicitud', path: '/solicitud' });
    }

    // Solo Admin: agrega Reportes
    if (this.authService.isAdmin()) {
      links.push({ label: 'Reportes', path: '/reportes' });
    }

    this.navLinks = links;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.buildNavLinks();
        this.router.navigate(['/inicio']);
      },
      error: () => {
        // aunque falle el back, limpiamos localmente
        this.buildNavLinks();
        this.router.navigate(['/inicio']);
      }
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 20;
  }

  toggleMenu() { this.mobileMenuOpen = !this.mobileMenuOpen; }
  closeMenu()  { this.mobileMenuOpen = false; }

  ngOnDestroy() { this.sub.unsubscribe(); }
}
