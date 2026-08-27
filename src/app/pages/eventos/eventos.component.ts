import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventsService, Event } from '../../services/events.service';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './eventos.component.html',
  styleUrl: './eventos.component.css'
})
export class EventosComponent implements OnInit {
  events: Event[] = [];
  filteredEvents: Event[] = [];
  categories: string[] = [];
  activeCategory = 'Todos los eventos';
  selectedMonth = new Date();
  today = new Date();

  calendarDays: (number | null)[] = [];
  monthName = '';
  monthYear = '';

  constructor(private eventsService: EventsService) {}

  ngOnInit() {
    this.events = this.eventsService.getAll();
    this.filteredEvents = [...this.events];
    this.categories = this.eventsService.getCategories();
    this.buildCalendar();
  }

  filterBy(cat: string) {
    this.activeCategory = cat;
    this.filteredEvents = this.eventsService.getByCategory(
      cat === 'Todos los eventos' ? 'Todos' : cat
    );
  }

  buildCalendar() {
    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    this.monthName = this.selectedMonth.toLocaleString('es-AR', { month: 'long' });
    this.monthYear = `${this.monthName.charAt(0).toUpperCase() + this.monthName.slice(1)} ${year}`;
    this.calendarDays = [];
    for (let i = 0; i < firstDay; i++) this.calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) this.calendarDays.push(i);
  }

  prevMonth() {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth() {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 1);
    this.buildCalendar();
  }

  isEventDay(day: number | null): boolean {
    if (!day) return false;
    const eventDays = [15, 22, 5, 20];
    return eventDays.includes(day);
  }

  isToday(day: number | null): boolean {
    return day === this.today.getDate() &&
      this.selectedMonth.getMonth() === this.today.getMonth() &&
      this.selectedMonth.getFullYear() === this.today.getFullYear();
  }
}
