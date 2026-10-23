import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FacilitiesService, Facility } from '../../services/facilities.service';

@Component({
  selector: 'app-instalaciones',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './instalaciones.component.html',
  styleUrl: './instalaciones.component.css'
})
export class InstalacionesComponent implements OnInit {
  facilities: Facility[] = [];
  services: any[] = [];
  loading = false;

  stats = [
    { icon: 'fa-building', value: '10+', label: 'Instalaciones deportivas' },
    { icon: 'fa-door-open', value: '', label: 'Vestuarios modernos' },
    { icon: 'fa-shield-halved', value: '', label: 'Seguridad y primeros auxilios' },
    { icon: 'fa-square-parking', value: 'P', label: 'Estacionamiento para socios' },
    { icon: 'fa-wifi', value: '', label: 'Wi-Fi en todas las áreas' }
  ];

  constructor(private facilitiesService: FacilitiesService) {}

  ngOnInit() {
    this.loading = true;
    this.facilitiesService.getAll().subscribe({
      next: (data) => {
        this.facilities = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar instalaciones:', err);
        this.loading = false;
      }
    });
    this.services = this.facilitiesService.getServices();
  }
}
