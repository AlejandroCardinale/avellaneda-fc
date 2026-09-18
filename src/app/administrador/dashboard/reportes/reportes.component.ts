import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportFilters, ReportResponse, ReportesService } from './reportes.service';

@Component({
  selector: 'app-reportes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesAdminComponent implements OnInit {
  report!: ReportResponse;
  filters: ReportFilters = this.defaultFilters();
  activeRange = '3M';
  loading = false;
  exporting = '';
  errorMessage = '';
  readonly disciplinas = [
    { id: '', nombre: 'Todas las disciplinas' },
    { id: '1', nombre: 'Fútbol' },
    { id: '2', nombre: 'Natación' },
    { id: '3', nombre: 'Tenis' },
    { id: '4', nombre: 'Gimnasia' },
    { id: '6', nombre: 'Voleibol' },
    { id: '7', nombre: 'Atletismo' }
  ];
  readonly ranges = [
    { key: '7D', days: 7 }, { key: '1M', days: 30 }, { key: '3M', days: 90 }, { key: '6M', days: 180 }, { key: '1A', days: 365 }
  ];

  constructor(private service: ReportesService) {}

  ngOnInit(): void { this.loadReport(); }

  loadReport(): void {
    this.loading = true;
    this.service.obtener(this.filters).subscribe({
      next: report => { this.report = report; this.loading = false; },
      error: error => { this.errorMessage = error?.error?.message || 'No se pudo cargar el reporte.'; this.loading = false; }
    });
  }

  applyRange(range: { key: string; days: number }): void {
    this.activeRange = range.key;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - range.days + 1);
    this.filters.desde = this.toDate(start);
    this.filters.hasta = this.toDate(end);
    this.loadReport();
  }

  onFilterChange(): void { this.activeRange = ''; this.loadReport(); }

  export(format: 'excel' | 'pdf'): void {
    this.exporting = format;
    this.service.exportar(this.filters, format).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = format === 'excel' ? 'reporte-avellaneda-fc.csv' : 'reporte-avellaneda-fc.html';
        anchor.click();
        URL.revokeObjectURL(url);
        this.exporting = '';
      },
      error: () => { this.errorMessage = 'No se pudo exportar el reporte.'; this.exporting = ''; }
    });
  }

  generate(): void { this.loadReport(); }

  maxDiscipline(): number { return Math.max(...(this.report?.atletasPorDisciplina || []).map(item => item.total), 1); }
  maxRequested(): number { return Math.max(...(this.report?.recursosMasSolicitados || []).map(item => item.total), 1); }
  barClass(value: number): string { return value >= 85 ? 'high' : value >= 75 ? 'normal' : 'low'; }
  formatMetric(value: number, suffix = ''): string { return `${value}${suffix}`; }

  private defaultFilters(): ReportFilters {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 89);
    return { desde: this.toDate(start), hasta: this.toDate(end), disciplina: '' };
  }

  private toDate(date: Date): string { return date.toISOString().slice(0, 10); }
}
