import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NewsService, News } from '../../services/news.service';
import { FacilitiesService } from '../../services/facilities.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  latestNews!: News;
  services: any[] = [];

  stats = [
    { icon: 'fa-building', value: '10+', label: 'Instalaciones deportivas' },
    { icon: 'fa-door-open', value: '', label: 'Vestuarios modernos' },
    { icon: 'fa-shield-halved', value: '', label: 'Seguridad y primeros auxilios' },
    { icon: 'fa-square-parking', value: 'P', label: 'Estacionamiento para socios' },
    { icon: 'fa-wifi', value: '', label: 'Wi-Fi en todas las áreas' }
  ];

  constructor(
    private newsService: NewsService,
    private facilitiesService: FacilitiesService
  ) {}

  ngOnInit() {
    this.latestNews = this.newsService.getLatest();
    this.services = this.facilitiesService.getServices();
  }
}
