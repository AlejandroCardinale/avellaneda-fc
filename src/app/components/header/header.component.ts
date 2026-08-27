import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  mobileMenuOpen = false;
  scrolled = false;

  navLinks = [
    { label: 'Inicio', path: '/inicio' },
    { label: 'Noticias', path: '/noticias' },
    { label: 'Deportes', path: '/deportes' },
    { label: 'Instalaciones', path: '/instalaciones' },
    { label: 'Eventos', path: '/eventos' },
    { label: 'Contacto', path: '/contacto' }
  ];

  ngOnInit() {}

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 20;
  }

  toggleMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMenu() {
    this.mobileMenuOpen = false;
  }
}
