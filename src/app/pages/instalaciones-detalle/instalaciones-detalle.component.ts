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
  loading = false;
  relatedFacilities: Facility[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private facilitiesService: FacilitiesService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (!idParam) {
        this.notFound = true;
        return;
      }

      const id = parseInt(idParam, 10);
      if (isNaN(id)) {
        this.notFound = true;
        return;
      }

      this.loading = true;
      this.notFound = false;

      this.facilitiesService.getById(id).subscribe({
        next: (facility) => {
          this.facility = facility;
          this.notFound = !facility;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar detalle de instalación:', err);
          this.notFound = true;
          this.loading = false;
        }
      });

      this.facilitiesService.getAll().subscribe({
        next: (all) => {
          this.relatedFacilities = all
            .filter(f => f.id !== id)
            .slice(0, 3);
        },
        error: (err) => {
          console.error('Error al cargar instalaciones relacionadas:', err);
        }
      });
    });
  }

  goBack() {
    this.router.navigate(['/instalaciones']);
  }
}
