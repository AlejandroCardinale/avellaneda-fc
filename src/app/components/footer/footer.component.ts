import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  year = new Date().getFullYear();

  navLinks = [
    { label: 'Inicio', path: '/inicio' },
    { label: 'Noticias', path: '/noticias' },
    { label: 'Deportes', path: '/deportes' },
    { label: 'Instalaciones', path: '/instalaciones' },
    { label: 'Eventos', path: '/eventos' },
    { label: 'Contacto', path: '/contacto' }
  ];

  socialLinks = [
    { icon: 'fa-brands fa-facebook-f', url: '#', label: 'Facebook' },
    { icon: 'fa-brands fa-instagram', url: '#', label: 'Instagram' },
    { icon: 'fa-brands fa-youtube', url: '#', label: 'YouTube' },
    { icon: 'fa-brands fa-x-twitter', url: '#', label: 'Twitter/X' }
  ];
}
