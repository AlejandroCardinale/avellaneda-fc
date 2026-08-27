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

  statItems = [
    { value: '12', label: 'Disciplinas', icon: 'fa-medal' },
    { value: '+300', label: 'Atletas', icon: 'fa-users' },
    { value: '45', label: 'Entrenadores', icon: 'fa-whistle' },
    { value: '+1500', label: 'Socios', icon: 'fa-id-card' }
  ];

  constructor(
    private sportsService: SportsService,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.sports = this.sportsService.getAll();
    this.filteredSports = [...this.sports];
    this.events = this.eventsService.getUpcoming(3);
    this.stats = this.sportsService.getStats();
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.filteredSports = [...this.sports];
    } else {
      this.filteredSports = this.sportsService.search(this.searchQuery);
    }
  }
}
