import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, finalize, switchMap } from 'rxjs';
import { ReportFilters, ReportResponse, ReportesService } from './reportes.service';

type ExportFormat = 'excel' | 'pdf' | 'csv' | 'json';

@Component({
  selector: 'app-reportes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesAdminComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly filterChanges = new Subject<ReportFilters>();
  report!: ReportResponse;
  private loadedFilters?: ReportFilters;
  filters: ReportFilters = this.defaultFilters();
  activeRange = '3M';
  loading = false;
  exporting: ExportFormat | '' = '';
  errorMessage = '';
  private readonly chartColors = ['#087f8c', '#f0a202', '#2364aa', '#7b9e3b', '#d1495b', '#635380', '#52a675', '#ed6a5a'];
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

  ngOnInit(): void {
    this.filterChanges.pipe(
      switchMap(filters => {
        this.loading = true;
        this.errorMessage = '';
        return this.service.obtener(filters).pipe(
          catchError(error => {
            this.errorMessage = error?.error?.message || 'No se pudo cargar el reporte.';
            return EMPTY;
          }),
          finalize(() => this.loading = false)
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(report => {
      this.report = report;
      this.loadedFilters = { ...report.filters };
    });
    this.loadReport();
  }

  loadReport(): void {
    if (this.filters.desde && this.filters.hasta && this.filters.desde > this.filters.hasta) {
      this.errorMessage = 'La fecha inicial no puede ser posterior a la fecha final.';
      return;
    }
    this.filterChanges.next({ ...this.filters });
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

  canExport(): boolean {
    return !!this.report && !!this.loadedFilters && !this.loading && !this.exporting
      && this.filters.desde === this.loadedFilters.desde
      && this.filters.hasta === this.loadedFilters.hasta
      && this.filters.disciplina === this.loadedFilters.disciplina;
  }

  export(format: ExportFormat): void {
    if (!this.canExport() || !this.report || !this.loadedFilters) return;

    this.exporting = format;
    this.errorMessage = '';
    const snapshot: ReportResponse = { ...this.report, filters: { ...this.loadedFilters } };

    try {
      if (format === 'excel') this.exportExcel(snapshot);
      if (format === 'pdf') this.exportPdf(snapshot);
      if (format === 'csv') this.exportCsv(snapshot);
      if (format === 'json') this.exportJson(snapshot);
    } catch {
      this.errorMessage = 'No se pudo generar el archivo. Inténtalo nuevamente.';
    } finally {
      this.exporting = '';
    }
  }

  generate(): void { this.loadReport(); }

  /** Imprime la página exactamente como se ve — captura donut, barras y todos los gráficos CSS */
  printReport(): void {
    window.print();
  }

  maxDiscipline(): number { return Math.max(...(this.report?.atletasPorDisciplina || []).map(item => item.total), 1); }
  maxRegistrations(): number { return Math.max(...(this.report?.registrosPorPeriodo || []).map(item => item.total), 1); }
  totalDiscipline(): number { return (this.report?.atletasPorDisciplina || []).reduce((total, item) => total + item.total, 0); }
  registrationHeight(value: number): number { return Math.max((value / this.maxRegistrations()) * 100, 3); }
  disciplineColor(index: number): string { return this.chartColors[index % this.chartColors.length]; }
  disciplineGradient(): string {
    const values = this.report?.atletasPorDisciplina || [];
    const total = values.reduce((sum, item) => sum + item.total, 0);
    if (!total) return 'conic-gradient(#e7edf1 0deg 360deg)';
    let cursor = 0;
    const stops = values.map((item, index) => {
      const next = cursor + (item.total / total) * 360;
      const stop = `${this.disciplineColor(index)} ${cursor}deg ${next}deg`;
      cursor = next;
      return stop;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }

  private exportExcel(report: ReportResponse): void {
    const sheets = [
      { name: 'Resumen', rows: [
        ['REPORTE ESTADÍSTICO - AVELLANEDA FC'],
        ['Generado', new Date().toLocaleString('es-AR')],
        ['Desde', report.filters.desde],
        ['Hasta', report.filters.hasta],
        ['Disciplina', this.disciplineName(report.filters.disciplina)],
        [], ['Indicador', 'Valor'],
        ['Total atletas', report.metrics.totalAtletas],
        ['Promedio asistencia', `${report.metrics.promedioAsistencia}%`],
        ['Recursos en uso', report.metrics.recursosEnUso],
        ['Solicitudes resueltas', report.metrics.solicitudesResueltas]
      ] },
      { name: 'Disciplinas', rows: [['Disciplina', 'Atletas'], ...report.atletasPorDisciplina.map(item => [item.nombre, item.total])] },
      { name: 'Tendencia', rows: [['Semana', 'Atletas registrados'], ...report.registrosPorPeriodo.map(item => [item.periodo, item.total])] },
      { name: 'Asistencia', rows: [
        ['Atleta', 'Entrenamiento', 'Fecha', 'Estado'],
        ...report.asistenciasDetalle.map(item => [item.atleta, item.entrenamiento, this.formatDate(item.fecha), item.presente ? 'Presente' : 'Ausente'])
      ] },
      { name: 'Recursos', rows: [
        ['Recurso solicitado', 'Usuario responsable', 'Fecha', 'Estado'],
        ...report.actividadRecursos.map(item => [item.recurso, item.usuario, this.formatDate(item.fecha), this.statusName(item.estado)])
      ] },
      { name: 'Más solicitados', rows: [['Recurso', 'Cantidad'], ...report.recursosMasSolicitados.map(item => [item.nombre, item.total])] }
    ];
    this.downloadBlob(this.createXlsx(sheets), this.fileName('xlsx'));
  }

  private exportCsv(report: ReportResponse): void {
    const rows: unknown[][] = [
      ['REPORTE ESTADÍSTICO - AVELLANEDA FC'],
      ['Desde', report.filters.desde],
      ['Hasta', report.filters.hasta],
      ['Disciplina', this.disciplineName(report.filters.disciplina)],
      [], ['Indicador', 'Valor'],
      ['Total atletas', report.metrics.totalAtletas],
      ['Promedio asistencia', `${report.metrics.promedioAsistencia}%`],
      ['Recursos en uso', report.metrics.recursosEnUso],
      ['Solicitudes resueltas', report.metrics.solicitudesResueltas],
      [], ['Atletas por disciplina', 'Total'],
      ...report.atletasPorDisciplina.map(item => [item.nombre, item.total]),
      [], ['Recursos más solicitados', 'Cantidad'],
      ...report.recursosMasSolicitados.map(item => [item.nombre, item.total]),
      [], ['Altas por semana', 'Total'],
      ...report.registrosPorPeriodo.map(item => [item.periodo, item.total]),
      [], ['Atleta', 'Entrenamiento', 'Fecha', 'Estado de asistencia'],
      ...report.asistenciasDetalle.map(item => [item.atleta, item.entrenamiento, this.formatDate(item.fecha), item.presente ? 'Presente' : 'Ausente']),
      [], ['Recurso solicitado', 'Usuario responsable', 'Fecha', 'Estado'],
      ...report.actividadRecursos.map(item => [item.recurso, item.usuario, this.formatDate(item.fecha), this.statusName(item.estado)])
    ];
    const csv = rows.map(row => row.map(value => this.csvCell(value)).join(',')).join('\r\n');
    this.downloadBlob(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }), this.fileName('csv'));
  }

  private exportJson(report: ReportResponse): void {
    const json = JSON.stringify({ generadoEn: new Date().toISOString(), ...report }, null, 2);
    this.downloadBlob(new Blob([json], { type: 'application/json;charset=utf-8' }), this.fileName('json'));
  }

  private exportPdf(report: ReportResponse): void {
    const pages: string[][] = [[]];
    const P = pages;

    // ── Helpers de dibujo PDF ─────────────────────────────────────
    const newPage = () => { P.push([]); };
    const cur = () => P[P.length - 1];

    const rect = (x: number, y: number, w: number, h: number, r: number, g: number, b: number) =>
      cur().push(`${r} ${g} ${b} rg ${x} ${y} ${w} ${h} re f`);

    const line = (x1: number, y1: number, x2: number, y2: number, r: number, g: number, b: number, lw = 0.5) =>
      cur().push(`${r} ${g} ${b} RG ${lw} w ${x1} ${y1} m ${x2} ${y2} l S`);

    const txt = (text: string, x: number, y: number, size: number, r: number, g: number, b: number, bold = false) =>
      cur().push(`${r} ${g} ${b} rg BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${this.pdfString(text)}) Tj ET`);

    // ── PÁGINA 1 — CABECERA ───────────────────────────────────────
    rect(0, 778, 595, 64, 0.09, 0.25, 0.46);
    txt('AVELLANEDA FC', 40, 815, 18, 1, 1, 1, true);
    txt('Reporte estadistico', 40, 795, 10, 1, 1, 1);
    txt(`Periodo: ${report.filters.desde || '—'} al ${report.filters.hasta || '—'}`, 40, 761, 10, 0.18, 0.24, 0.27);
    txt(`Disciplina: ${this.disciplineName(report.filters.disciplina)}`, 40, 746, 10, 0.18, 0.24, 0.27);
    txt(`Generado: ${new Date().toLocaleString('es-AR')}`, 350, 761, 8, 0.5, 0.5, 0.5);

    // ── MÉTRICAS (4 tarjetas) ─────────────────────────────────────
    const cards = [
      ['Total atletas',         String(report.metrics.totalAtletas)],
      ['Asistencia promedio',   `${report.metrics.promedioAsistencia}%`],
      ['Recursos en uso',       String(report.metrics.recursosEnUso)],
      ['Solicitudes resueltas', String(report.metrics.solicitudesResueltas)]
    ];
    cards.forEach(([label, value], i) => {
      const cx = 40 + (i % 2) * 260, cy = 695 - Math.floor(i / 2) * 50;
      rect(cx, cy, 245, 42, 0.94, 0.96, 0.98);
      line(cx, cy + 42, cx, cy, 0.09, 0.25, 0.46, 3);
      txt(label, cx + 10, cy + 28, 8, 0.41, 0.49, 0.51);
      txt(value,  cx + 10, cy + 10, 13, 0.09, 0.25, 0.46, true);
    });

    // ── GRÁFICO 1: BARRAS HORIZONTALES — Atletas por disciplina ──
    const chartColors = [
      [0.03, 0.50, 0.55], [0.94, 0.63, 0.01], [0.14, 0.39, 0.67],
      [0.48, 0.62, 0.23], [0.82, 0.29, 0.36], [0.39, 0.33, 0.50],
      [0.32, 0.65, 0.46], [0.93, 0.42, 0.35]
    ];
    const disc = report.atletasPorDisciplina.filter(d => d.total > 0);
    const maxDisc = Math.max(...disc.map(d => d.total), 1);
    txt('Atletas por disciplina', 40, 582, 11, 0.09, 0.25, 0.46, true);
    line(40, 576, 360, 576, 0.8, 0.85, 0.87);
    disc.slice(0, 7).forEach((d, i) => {
      const by = 558 - i * 22;
      const bw = Math.max(4, (d.total / maxDisc) * 280);
      const [cr, cg, cb] = chartColors[i % chartColors.length];
      rect(40, by, bw, 14, cr, cg, cb);
      txt(d.nombre, 40 + bw + 6, by + 3, 7.5, 0.2, 0.28, 0.32);
      txt(String(d.total), 40 + bw + 6, by - 5, 6, 0.5, 0.5, 0.5);
    });

    // ── GRÁFICO 2: BARRAS VERTICALES — Asistencia semanal ────────
    const att = report.asistenciaSemanal.slice(-8);
    if (att.length > 0) {
      txt('Tendencia de asistencia (%)', 370, 582, 11, 0.09, 0.25, 0.46, true);
      line(370, 576, 555, 576, 0.8, 0.85, 0.87);
      const barW = Math.floor(160 / (att.length + 1));
      att.forEach((a, i) => {
        const bx = 375 + i * (barW + 2);
        const bh = Math.max(2, (a.porcentaje / 100) * 100);
        const by = 468;
        // Gradiente simulado con 2 rectángulos
        rect(bx, by, barW, bh, 0.14, 0.39, 0.67);
        rect(bx, by + bh - 4, barW, 4, 0.09, 0.25, 0.46);
        txt(`${a.porcentaje}%`, bx, by + bh + 3, 5.5, 0.2, 0.28, 0.32);
        txt(a.periodo, bx - 1, by - 8, 5.5, 0.5, 0.5, 0.5);
      });
      // Eje Y
      [0, 25, 50, 75, 100].forEach(v => {
        const vy = 468 + (v / 100) * 100;
        line(370, vy, 555, vy, 0.88, 0.9, 0.92, 0.3);
        txt(`${v}%`, 358, vy - 2, 5, 0.6, 0.6, 0.6);
      });
    }

    // ── GRÁFICO 3: TORTA / DONUT — Atletas por disciplina ───────────
    const disc2 = report.atletasPorDisciplina.filter(d => d.total > 0);
    if (disc2.length > 0) {
      const total2 = disc2.reduce((s, d) => s + d.total, 0);
      txt('Distribucion por disciplina (torta)', 370, 460, 11, 0.09, 0.25, 0.46, true);
      line(370, 454, 555, 454, 0.8, 0.85, 0.87);

      // Centro y radio del donut
      const cx2 = 440, cy2 = 360, R = 60, r2 = 30;
      this.drawPdfDonut(cur(), cx2, cy2, R, r2, disc2.map((d, i) => ({
        value: d.total,
        total: total2,
        color: chartColors[i % chartColors.length] as [number,number,number]
      })));

      // Leyenda al lado
      disc2.slice(0, 8).forEach((d, i) => {
        const ly = 435 - i * 14;
        const [cr, cg, cb] = chartColors[i % chartColors.length];
        rect(371, ly, 8, 8, cr, cg, cb);
        txt(`${d.nombre} (${d.total})`, 384, ly + 1, 6.5, 0.2, 0.28, 0.32);
      });
    }

    // ── RECURSOS MÁS SOLICITADOS — barras horizontales ───────────
    const res = report.recursosMasSolicitados.filter(r => r.total > 0);
    if (res.length > 0) {
      const totalRes = res.reduce((s, r) => s + r.total, 0);
      txt('Recursos mas solicitados', 40, 460, 11, 0.09, 0.25, 0.46, true);
      line(40, 454, 330, 454, 0.8, 0.85, 0.87);
      res.slice(0, 5).forEach((r, i) => {
        const by2 = 436 - i * 18;
        const bw2 = Math.max(4, (r.total / totalRes) * 240);
        const [cr, cg, cb] = chartColors[i % chartColors.length];
        rect(40, by2, bw2, 12, cr, cg, cb);
        txt(r.nombre.substring(0, 22), 40 + bw2 + 5, by2 + 2, 7, 0.2, 0.28, 0.32);
        txt(String(r.total), 40 + bw2 + 5, by2 - 5, 6, 0.5, 0.5, 0.5);
      });
    }

    // ── PÁGINA 2 — TABLAS ─────────────────────────────────────────
    newPage();
    rect(0, 778, 595, 64, 0.09, 0.25, 0.46);
    txt('AVELLANEDA FC — Detalle', 40, 815, 16, 1, 1, 1, true);
    txt('Tablas de asistencia, actividad de recursos y ranking de atletas', 40, 797, 9, 1, 1, 1);

    // Ranking de atletas (usa fn_porcentaje_asistencia vía SP)
    if (report.rankingAtletas && report.rankingAtletas.length > 0) {
      txt('Ranking de atletas por asistencia', 40, 754, 11, 0.09, 0.25, 0.46, true);
      line(40, 748, 555, 748, 0.8, 0.85, 0.87);
      rect(40, 728, 515, 17, 0.92, 0.95, 0.95);
      txt('Atleta', 44, 732, 8, 0.2, 0.29, 0.32, true);
      txt('Deporte', 220, 732, 8, 0.2, 0.29, 0.32, true);
      txt('% Asistencia', 340, 732, 8, 0.2, 0.29, 0.32, true);
      txt('Sesiones', 440, 732, 8, 0.2, 0.29, 0.32, true);
      let ry = 714;
      report.rankingAtletas.forEach((a, i) => {
        if (i % 2 === 0) rect(40, ry - 4, 515, 16, 0.97, 0.98, 0.99);
        txt(a.atleta, 44, ry, 8, 0.24, 0.31, 0.34);
        txt(a.deporte, 220, ry, 8, 0.24, 0.31, 0.34);
        // Mini barra de % asistencia
        const bw = Math.max(2, (a.pctAsistencia / 100) * 80);
        rect(340, ry - 1, bw, 8, 0.03, 0.50, 0.55);
        txt(`${a.pctAsistencia}%`, 425, ry, 7.5, 0.2, 0.28, 0.32);
        txt(String(a.sesTotales), 440, ry, 8, 0.24, 0.31, 0.34);
        line(40, ry - 5, 555, ry - 5, 0.86, 0.90, 0.90, 0.4);
        ry -= 16;
      });
    }

    // Tabla asistencias detalle
    let ty = pages.length === 1 ? 350 : Math.min((pages[pages.length - 1] as string[]).length > 0 ? 440 : 720, 440);
    ty = this.appendPdfTable(
      P, 'Asistencia a entrenamientos', ['Atleta', 'Entrenamiento', 'Fecha', 'Estado'],
      report.asistenciasDetalle.map(i => [i.atleta, i.entrenamiento, this.formatDate(i.fecha), i.presente ? 'Presente' : 'Ausente']),
      400, [130, 175, 120, 90], txt
    );
    this.appendPdfTable(
      P, 'Actividad de recursos', ['Recurso', 'Responsable', 'Fecha', 'Estado'],
      report.actividadRecursos.map(i => [i.recurso, i.usuario, this.formatDate(i.fecha), i.estado]),
      ty - 16, [130, 145, 135, 105], txt
    );

    // ── PIE DE PÁGINA en cada hoja ────────────────────────────────
    P.forEach((page, idx) => {
      page.push(`0.48 0.53 0.55 rg BT /F1 8 Tf 40 24 Td (Avellaneda FC  |  Pagina ${idx + 1} de ${P.length}  |  Generado con sp_reporte_general + fn_porcentaje_asistencia) Tj ET`);
    });

    this.downloadBlob(this.createPdf(P), this.fileName('pdf'));
  }

  private appendPdfTable(pages: string[][], title: string, headers: string[], rows: string[][], startY: number, widths: number[], addText: (text: string, x: number, y: number, size: number, r: number, g: number, b: number, bold?: boolean) => void): number {
    const x = 40;
    const tableWidth = widths.reduce((sum, width) => sum + width, 0);
    let y = startY;
    const addHeading = (continued: boolean): void => {
      if (y < 74) { pages.push([]); y = 790; }
      pages[pages.length - 1].push(`0.03 0.5 0.55 rg ${x} ${y - 17} ${tableWidth} 20 re f`);
      addText(continued ? `${title} (continuacion)` : title, x + 8, y - 12, 10, 1, 1, 1, true);
      y -= 23;
      pages[pages.length - 1].push(`0.92 0.95 0.95 rg ${x} ${y - 16} ${tableWidth} 18 re f`);
      let columnX = x;
      headers.forEach((header, index) => {
        addText(header, columnX + 5, y - 11, 8, 0.2, 0.29, 0.32, true);
        columnX += widths[index];
      });
      y -= 20;
    };
    addHeading(false);

    rows.forEach(row => {
      const cells = row.map((value, index) => this.wrapText(value || '-', Math.max(12, Math.floor((widths[index] - 10) / 4.5))));
      const lineCount = Math.max(1, ...cells.map(lines => lines.length));
      const rowHeight = Math.max(18, lineCount * 10 + 5);
      if (y - rowHeight < 42) { pages.push([]); y = 790; addHeading(true); }
      let columnX = x;
      cells.forEach((lines, index) => {
        lines.forEach((line, lineIndex) => addText(line, columnX + 5, y - 10 - lineIndex * 10, 7, 0.24, 0.31, 0.34));
        columnX += widths[index];
      });
      y -= rowHeight;
      pages[pages.length - 1].push(`0.86 0.9 0.9 RG 0.5 w ${x} ${y} m ${x + tableWidth} ${y} l S`);
    });
    return y;
  }

  /**
   * Dibuja un gráfico de torta/donut en el PDF usando curvas de Bézier.
   * PDF no tiene un operador arc nativo, por eso se aproxima con Bézier cúbicas.
   * Se usa la fórmula k = (4/3)*tan(θ/4) para los puntos de control.
   *
   * @param page   - Array de comandos de la página actual
   * @param cx     - Centro X del donut en coordenadas PDF
   * @param cy     - Centro Y del donut en coordenadas PDF
   * @param R      - Radio exterior
   * @param rInner - Radio interior (agujero del donut). 0 = torta sólida
   * @param slices - Array de { value, total, color }
   */
  private drawPdfDonut(
    page: string[],
    cx: number, cy: number,
    R: number, rInner: number,
    slices: { value: number; total: number; color: [number, number, number] }[]
  ): void {
    const TAU = 2 * Math.PI;

    // Convierte un ángulo y radio a coordenadas cartesianas PDF
    const pt = (angle: number, radius: number) => ({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    });

    // Aproxima un arco con una serie de curvas de Bézier cúbicas (máx 90° por segmento)
    const arcPath = (startAngle: number, endAngle: number, radius: number): string => {
      const segments: string[] = [];
      const steps = Math.ceil(Math.abs(endAngle - startAngle) / (Math.PI / 2));
      const step = (endAngle - startAngle) / steps;

      for (let s = 0; s < steps; s++) {
        const a0 = startAngle + s * step;
        const a1 = a0 + step;
        const k = (4 / 3) * Math.tan(step / 4);

        const p0 = pt(a0, radius);
        const p3 = pt(a1, radius);

        // Puntos de control tangentes al círculo
        const p1 = {
          x: p0.x - Math.sin(a0) * radius * k,
          y: p0.y + Math.cos(a0) * radius * k
        };
        const p2 = {
          x: p3.x + Math.sin(a1) * radius * k,
          y: p3.y - Math.cos(a1) * radius * k
        };

        const fmt = (n: number) => n.toFixed(3);
        segments.push(
          `${fmt(p1.x)} ${fmt(p1.y)} ${fmt(p2.x)} ${fmt(p2.y)} ${fmt(p3.x)} ${fmt(p3.y)} c`
        );
      }
      return segments.join(' ');
    };

    let startAngle = -Math.PI / 2; // Empieza desde arriba (12 en punto)

    slices.forEach(slice => {
      if (slice.value <= 0) return;
      const angle = (slice.value / slice.total) * TAU;
      const endAngle = startAngle + angle;
      const [r, g, b] = slice.color;

      const start = pt(startAngle, R);
      const fmt = (n: number) => n.toFixed(3);

      // Color del sector
      page.push(`${r} ${g} ${b} rg`);

      // Path: mueve al borde exterior, dibuja arco exterior, línea al centro (o radio interior)
      if (rInner > 0) {
        // Donut: arco exterior → arco interior (en sentido inverso)
        const innerStart = pt(endAngle, rInner);
        const innerEnd   = pt(startAngle, rInner);

        page.push([
          `${fmt(start.x)} ${fmt(start.y)} m`,           // Mueve a inicio del arco exterior
          arcPath(startAngle, endAngle, R),               // Arco exterior
          `${fmt(innerStart.x)} ${fmt(innerStart.y)} l`,  // Línea al radio interior
          arcPath(endAngle, startAngle, rInner),          // Arco interior (inverso)
          `${fmt(innerEnd.x)} ${fmt(innerEnd.y)} l`,      // Cierra al inicio
          'f'                                             // Rellena
        ].join(' '));
      } else {
        // Torta sólida: desde el centro
        page.push([
          `${fmt(cx)} ${fmt(cy)} m`,
          `${fmt(start.x)} ${fmt(start.y)} l`,
          arcPath(startAngle, endAngle, R),
          'f'
        ].join(' '));
      }

      // Etiqueta: % en el centro de cada sector (solo si el sector es suficientemente grande)
      const pct = Math.round((slice.value / slice.total) * 100);
      if (pct >= 5) {
        const midAngle = startAngle + angle / 2;
        const labelRadius = rInner > 0 ? (R + rInner) / 2 : R * 0.6;
        const lp = pt(midAngle, labelRadius);
        const fontSize = pct >= 10 ? 6 : 5;
        page.push(`1 1 1 rg BT /F2 ${fontSize} Tf ${fmt(lp.x - 6)} ${fmt(lp.y - 3)} Td (${pct}%) Tj ET`);
      }

      startAngle = endAngle;
    });

    // Borde exterior del donut (stroke fino)
    const startOuter = pt(-Math.PI / 2, R);
    page.push(`0.8 0.85 0.87 RG 0.5 w ${startOuter.x.toFixed(3)} ${startOuter.y.toFixed(3)} m ${arcPath(-Math.PI / 2, TAU - Math.PI / 2, R)} s`);
  }

  private createXlsx(sheets: { name: string; rows: unknown[][] }[]): Blob {
    const sheetOverrides = sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
    const sheetRelations = sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('');
    const workbookSheets = sheets.map((sheet, index) => `<sheet name="${this.xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('');
    const entries = [
      { name: '[Content_Types].xml', content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheetOverrides}</Types>` },
      { name: '_rels/.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${workbookSheets}</sheets></workbook>` },
      { name: 'xl/_rels/workbook.xml.rels', content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheetRelations}</Relationships>` },
      ...sheets.map((sheet, index) => ({ name: `xl/worksheets/sheet${index + 1}.xml`, content: this.worksheetXml(sheet.rows) }))
    ];
    const zipBytes = this.storeZip(entries);
    return new Blob([zipBytes.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  private worksheetXml(rows: unknown[][]): string {
    const columnName = (column: number): string => {
      let name = '';
      while (column > 0) {
        const remainder = (column - 1) % 26;
        name = String.fromCharCode(65 + remainder) + name;
        column = Math.floor((column - 1) / 26);
      }
      return name;
    };
    const xmlRows = rows.map((row, rowIndex) => {
      const cells = row.map((value, columnIndex) => {
        const reference = `${columnName(columnIndex + 1)}${rowIndex + 1}`;
        if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${reference}" t="n"><v>${value}</v></c>`;
        return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${this.xmlEscape(String(value ?? ''))}</t></is></c>`;
      }).join('');
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${xmlRows}</sheetData></worksheet>`;
  }

  private storeZip(entries: { name: string; content: string }[]): Uint8Array {
    const encoder = new TextEncoder();
    const encoded = entries.map(entry => ({ name: encoder.encode(entry.name), data: encoder.encode(entry.content) }));
    const crcTable = new Uint32Array(256);
    for (let index = 0; index < crcTable.length; index++) {
      let value = index;
      for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      crcTable[index] = value >>> 0;
    }
    const crc32 = (data: Uint8Array): number => {
      let crc = 0xffffffff;
      data.forEach(byte => { crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8); });
      return (crc ^ 0xffffffff) >>> 0;
    };
    const localLength = encoded.reduce((sum, entry) => sum + 30 + entry.name.length + entry.data.length, 0);
    const centralLength = encoded.reduce((sum, entry) => sum + 46 + entry.name.length, 0);
    const output = new Uint8Array(localLength + centralLength + 22);
    const view = new DataView(output.buffer);
    let offset = 0;
    const centralEntries: { entry: typeof encoded[number]; checksum: number; localOffset: number }[] = [];

    encoded.forEach(entry => {
      const localOffset = offset;
      const checksum = crc32(entry.data);
      view.setUint32(offset, 0x04034b50, true);
      view.setUint16(offset + 4, 20, true);
      view.setUint16(offset + 6, 0x0800, true);
      view.setUint16(offset + 8, 0, true);
      view.setUint32(offset + 14, checksum, true);
      view.setUint32(offset + 18, entry.data.length, true);
      view.setUint32(offset + 22, entry.data.length, true);
      view.setUint16(offset + 26, entry.name.length, true);
      offset += 30;
      output.set(entry.name, offset);
      offset += entry.name.length;
      output.set(entry.data, offset);
      offset += entry.data.length;
      centralEntries.push({ entry, checksum, localOffset });
    });

    const centralOffset = offset;
    centralEntries.forEach(({ entry, checksum, localOffset }) => {
      view.setUint32(offset, 0x02014b50, true);
      view.setUint16(offset + 4, 20, true);
      view.setUint16(offset + 6, 20, true);
      view.setUint16(offset + 8, 0x0800, true);
      view.setUint16(offset + 10, 0, true);
      view.setUint32(offset + 16, checksum, true);
      view.setUint32(offset + 20, entry.data.length, true);
      view.setUint32(offset + 24, entry.data.length, true);
      view.setUint16(offset + 28, entry.name.length, true);
      view.setUint32(offset + 42, localOffset, true);
      offset += 46;
      output.set(entry.name, offset);
      offset += entry.name.length;
    });

    view.setUint32(offset, 0x06054b50, true);
    view.setUint16(offset + 8, encoded.length, true);
    view.setUint16(offset + 10, encoded.length, true);
    view.setUint32(offset + 12, centralLength, true);
    view.setUint32(offset + 16, centralOffset, true);
    return output;
  }

  private createPdf(pages: string[][]): Blob {
    const objects: string[] = [];
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    const pageReferences: string[] = [];
    pages.forEach((commands, index) => {
      const pageId = 5 + index * 2;
      const contentId = pageId + 1;
      pageReferences.push(`${pageId} 0 R`);
      const stream = commands.join('\n');
      objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
      objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });
    objects[2] = `<< /Type /Pages /Kids [${pageReferences.join(' ')}] /Count ${pages.length} >>`;

    let source = '%PDF-1.4\n';
    const offsets = new Array<number>(objects.length).fill(0);
    for (let objectId = 1; objectId < objects.length; objectId++) {
      offsets[objectId] = source.length;
      source += `${objectId} 0 obj\n${objects[objectId]}\nendobj\n`;
    }
    const xrefOffset = source.length;
    source += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let objectId = 1; objectId < objects.length; objectId++) source += `${String(offsets[objectId]).padStart(10, '0')} 00000 n \n`;
    source += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    const bytes = new TextEncoder().encode(source);
    return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  }

  private pdfString(value: string): string {
    const extensionChars = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008dŽ\u008f\u0090‘’“”•–—˜™š›œ\u009džŸ';
    return Array.from(value).map(character => {
      const code = character.codePointAt(0) || 32;
      const extensionIndex = extensionChars.indexOf(character);
      const byte = extensionIndex >= 0 ? 0x80 + extensionIndex : code;
      if (byte < 32) return ' ';
      if (byte > 126) return `\\${byte.toString(8).padStart(3, '0')}`;
      if (character === '(' || character === ')' || character === '\\') return `\\${character}`;
      return character;
    }).join('');
  }

  private wrapText(value: string, maxCharacters: number): string[] {
    const words = value.split(/\s+/);
    const lines: string[] = [];
    let line = '';
    words.forEach(word => {
      if (line && `${line} ${word}`.length > maxCharacters) {
        lines.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    });
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  private xmlEscape(value: string): string {
    return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] || character)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  }

  private csvCell(value: unknown): string {
    let text = String(value ?? '');
    if (typeof value === 'string' && /^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private fileName(extension: string): string {
    const filters = this.loadedFilters || this.filters;
    return `reporte-avellaneda-fc_${filters.desde}_${filters.hasta}.${extension}`;
  }

  private disciplineName(id: string): string {
    return this.disciplinas.find(item => item.id === id)?.nombre || 'Todas las disciplinas';
  }

  private statusName(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  private formatDate(value: string | Date): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  }

  private defaultFilters(): ReportFilters {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 89);
    return { desde: this.toDate(start), hasta: this.toDate(end), disciplina: '' };
  }

  private toDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
