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

  // Deportes relacionados (los otros 3 más cercanos)
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
      this.sport = this.sportsService.getById(id);

      if (!this.sport) {
        this.notFound = true;
        return;
      }

      // Obtener 3 deportes relacionados (excluyendo el actual)
      const allSports = this.sportsService.getAll();
      this.relatedSports = allSports
        .filter(s => s.id !== id)
        .slice(0, 3);
    });
  }

  goBack() {
    this.router.navigate(['/deportes']);
  }
}
