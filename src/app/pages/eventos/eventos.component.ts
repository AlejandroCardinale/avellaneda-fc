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
  selectedDate: string | null = null;

  constructor(private eventsService: EventsService) {}

  ngOnInit() {
    // Obtenemos los eventos y los ordenamos cronológicamente
    this.events = this.eventsService.getAll().sort((a,b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime());
    this.filteredEvents = [...this.events];
    this.categories = this.eventsService.getCategories();
    this.buildCalendar();
  }

  filterBy(cat: string) {
    this.activeCategory = cat;
    this.selectedDate = null; // Al cambiar de categoría limpiamos la fecha
    this.applyFilters();
  }

  selectDate(day: number | null) {
    if (!day) return;
    
    const y = this.selectedMonth.getFullYear();
    const m = String(this.selectedMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const fullDate = `${y}-${m}-${d}`;

    // Toggle: si ya estaba seleccionada, la deselecciona
    if (this.selectedDate === fullDate) {
      this.selectedDate = null;
    } else {
      this.selectedDate = fullDate;
    }
    
    this.applyFilters();
  }

  clearDateFilter() {
    this.selectedDate = null;
    this.applyFilters();
  }

  applyFilters() {
    let result = this.events;

    if (this.activeCategory !== 'Todos los eventos') {
      result = result.filter(e => e.category === this.activeCategory);
    }

    if (this.selectedDate) {
      result = result.filter(e => e.isoDate === this.selectedDate);
    }

    this.filteredEvents = result;
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
    const y = this.selectedMonth.getFullYear();
    const m = String(this.selectedMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const fullDate = `${y}-${m}-${d}`;
    
    // Comprobar si hay un evento en esa fecha
    return this.events.some(e => e.isoDate === fullDate);
  }
  
  isSelectedDay(day: number | null): boolean {
    if (!day || !this.selectedDate) return false;
    const y = this.selectedMonth.getFullYear();
    const m = String(this.selectedMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const fullDate = `${y}-${m}-${d}`;
    
    return this.selectedDate === fullDate;
  }

  isToday(day: number | null): boolean {
    return day === this.today.getDate() &&
      this.selectedMonth.getMonth() === this.today.getMonth() &&
      this.selectedMonth.getFullYear() === this.today.getFullYear();
  }
}
