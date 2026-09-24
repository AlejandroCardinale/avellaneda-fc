import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FacilitiesService, Facility } from '../../services/facilities.service';

@Component({
  selector: 'app-instalaciones-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './instalaciones-detalle.component.html',
  styleUrl: './instalaciones-detalle.component.css'
})
export class InstalacionesDetalleComponent implements OnInit {
  facility: Facility | undefined;
  notFound = false;
  relatedFacilities: Facility[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private facilitiesService: FacilitiesService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (!idParam) { this.notFound = true; return; }

      const id = parseInt(idParam, 10);
      this.facility = this.facilitiesService.getById(id);

      if (!this.facility) { this.notFound = true; return; }

      this.relatedFacilities = this.facilitiesService.getAll()
        .filter(f => f.id !== id)
        .slice(0, 3);
    });
  }

  goBack() {
    this.router.navigate(['/instalaciones']);
  }
}
