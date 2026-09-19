import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { EventsService, Event } from '../../services/events.service';

@Component({
  selector: 'app-eventos-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './eventos-detalle.component.html',
  styleUrl: './eventos-detalle.component.css'
})
export class EventosDetalleComponent implements OnInit {
  event: Event | undefined;
  notFound = false;
  relatedEvents: Event[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (!idParam) { this.notFound = true; return; }

      const id = parseInt(idParam, 10);
      this.event = this.eventsService.getById(id);

      if (!this.event) { this.notFound = true; return; }

      this.relatedEvents = this.eventsService.getAll()
        .filter(e => e.id !== id)
        .slice(0, 3);
    });
  }

  getCategoryIcon(category: string): string {
    const map: Record<string, string> = {
      'Torneos': 'fa-trophy',
      'Deportivos': 'fa-medal',
      'Sociales': 'fa-champagne-glasses',
      'Institucionales': 'fa-building-columns'
    };
    return map[category] ?? 'fa-calendar';
  }
}
