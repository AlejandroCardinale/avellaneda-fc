import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { SportsService, Sport } from '../../services/sports.service';

@Component({
  selector: 'app-deportes-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './deportes-detalle.component.html',
  styleUrl: './deportes-detalle.component.css'
})
export class DeportesDetalleComponent implements OnInit {
  sport: Sport | undefined;
  notFound = false;
  loading = false;
  relatedSports: Sport[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sportsService: SportsService
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

      this.sportsService.getById(id).subscribe({
        next: (sport) => {
          this.sport = sport;
          this.notFound = !sport;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al cargar detalle de deporte:', err);
          this.notFound = true;
          this.loading = false;
        }
      });

      this.sportsService.getAll().subscribe({
        next: (allSports) => {
          this.relatedSports = allSports
            .filter(s => s.id !== id)
            .slice(0, 3);
        },
        error: (err) => {
          console.error('Error al cargar deportes relacionados:', err);
        }
      });
    });
  }

  goBack() {
    this.router.navigate(['/deportes']);
  }
}
