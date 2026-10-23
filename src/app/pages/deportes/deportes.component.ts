import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SportsService, Sport } from '../../services/sports.service';
import { EventsService, Event } from '../../services/events.service';

@Component({
  selector: 'app-deportes',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './deportes.component.html',
  styleUrl: './deportes.component.css'
})
export class DeportesComponent implements OnInit {
  sports: Sport[] = [];
  filteredSports: Sport[] = [];
  events: Event[] = [];
  stats: any;
  searchQuery = '';
  loading = false;

  statItems = [
    { value: '8', label: 'Disciplinas', icon: 'fa-medal' },
    { value: '+300', label: 'Atletas', icon: 'fa-users' },
    { value: '45', label: 'Entrenadores', icon: 'fa-whistle' },
    { value: '+1500', label: 'Socios', icon: 'fa-id-card' }
  ];

  constructor(
    private sportsService: SportsService,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.loading = true;
    this.sportsService.getAll().subscribe({
      next: (data) => {
        this.sports = data;
        this.filteredSports = [...data];
        this.updateStats(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar deportes:', err);
        this.loading = false;
      }
    });

    this.eventsService.getUpcoming(3).subscribe({
      next: (events) => this.events = events,
      error: (err) => console.error('Error cargando eventos en deportes:', err)
    });
    this.stats = this.sportsService.getStats();
  }

  private updateStats(sports: Sport[]) {
    const totalAthletes = sports.reduce((sum, s) => sum + (s.athletes || 0), 0);
    const totalCoaches = sports.reduce((sum, s) => sum + (s.coaches || 0), 0);

    this.statItems = [
      { value: String(sports.length || 8), label: 'Disciplinas', icon: 'fa-medal' },
      { value: `+${totalAthletes || 300}`, label: 'Atletas', icon: 'fa-users' },
      { value: String(totalCoaches || 45), label: 'Entrenadores', icon: 'fa-whistle' },
      { value: '+1500', label: 'Socios', icon: 'fa-id-card' }
    ];
  }

  onSearch() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredSports = [...this.sports];
    } else {
      this.filteredSports = this.sports.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
      );
    }
  }
}
