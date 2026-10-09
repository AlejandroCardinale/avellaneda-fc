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
    const addText = (text: string, x: number, y: number, size: number, color: string, bold = false): void => {
      pages[pages.length - 1].push(`${color} rg BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${this.pdfString(text)}) Tj ET`);
    };
    pages[0].push('0.09 0.25 0.46 rg 0 778 595 64 re f');
    addText('AVELLANEDA FC', 40, 813, 19, '1 1 1', true);
    addText('Reporte estadístico', 40, 793, 10, '1 1 1');
    addText(`Período: ${report.filters.desde} al ${report.filters.hasta}`, 40, 759, 10, '0.18 0.24 0.27');
    addText(`Disciplina: ${this.disciplineName(report.filters.disciplina)}`, 40, 744, 10, '0.18 0.24 0.27');

    const metrics = [
      ['Total atletas', String(report.metrics.totalAtletas)],
      ['Promedio asistencia', `${report.metrics.promedioAsistencia}%`],
      ['Recursos en uso', String(report.metrics.recursosEnUso)],
      ['Solicitudes resueltas', String(report.metrics.solicitudesResueltas)]
    ];
    metrics.forEach(([label, value], index) => {
      const x = 40 + (index % 2) * 265;
      const y = 695 - Math.floor(index / 2) * 44;
      pages[0].push(`0.95 0.97 0.97 rg ${x} ${y} 250 36 re f`);
      addText(label, x + 10, y + 22, 9, '0.41 0.49 0.51');
      addText(value, x + 10, y + 8, 12, '0.13 0.22 0.25', true);
    });

    let y = 590;
    y = this.appendPdfTable(pages, 'Atletas por disciplina', ['Disciplina', 'Atletas'], report.atletasPorDisciplina.map(item => [item.nombre, String(item.total)]), y, [365, 150], addText);
    y = this.appendPdfTable(pages, 'Recursos más solicitados', ['Recurso', 'Cantidad'], report.recursosMasSolicitados.map(item => [item.nombre, String(item.total)]), y - 12, [365, 150], addText);
    y = this.appendPdfTable(pages, 'Tendencia de registros', ['Semana', 'Atletas registrados'], report.registrosPorPeriodo.map(item => [item.periodo, String(item.total)]), y - 12, [240, 275], addText);
    y = this.appendPdfTable(pages, 'Asistencia a entrenamientos', ['Atleta', 'Entrenamiento', 'Fecha', 'Estado'], report.asistenciasDetalle.map(item => [item.atleta, item.entrenamiento, this.formatDate(item.fecha), item.presente ? 'Presente' : 'Ausente']), y - 12, [130, 175, 120, 90], addText);
    this.appendPdfTable(pages, 'Actividad de recursos', ['Recurso', 'Responsable', 'Fecha', 'Estado'], report.actividadRecursos.map(item => [item.recurso, item.usuario, this.formatDate(item.fecha), this.statusName(item.estado)]), y - 12, [130, 145, 135, 105], addText);

    pages.forEach((page, index) => {
      page.push(`0.48 0.53 0.55 rg BT /F1 8 Tf 40 24 Td (Avellaneda FC  |  Pagina ${index + 1} de ${pages.length}) Tj ET`);
    });
    this.downloadBlob(this.createPdf(pages), this.fileName('pdf'));
  }

  private appendPdfTable(pages: string[][], title: string, headers: string[], rows: string[][], startY: number, widths: number[], addText: (text: string, x: number, y: number, size: number, color: string, bold?: boolean) => void): number {
    const x = 40;
    const tableWidth = widths.reduce((sum, width) => sum + width, 0);
    let y = startY;
    const addHeading = (continued: boolean): void => {
      if (y < 74) { pages.push([]); y = 790; }
      pages[pages.length - 1].push(`0.03 0.5 0.55 rg ${x} ${y - 17} ${tableWidth} 20 re f`);
      addText(continued ? `${title} (continuacion)` : title, x + 8, y - 12, 10, '1 1 1', true);
      y -= 23;
      pages[pages.length - 1].push(`0.92 0.95 0.95 rg ${x} ${y - 16} ${tableWidth} 18 re f`);
      let columnX = x;
      headers.forEach((header, index) => {
        addText(header, columnX + 5, y - 11, 8, '0.2 0.29 0.32', true);
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
        lines.forEach((line, lineIndex) => addText(line, columnX + 5, y - 10 - lineIndex * 10, 7, '0.24 0.31 0.34'));
        columnX += widths[index];
      });
      y -= rowHeight;
      pages[pages.length - 1].push(`0.86 0.9 0.9 RG 0.5 w ${x} ${y} m ${x + tableWidth} ${y} l S`);
    });
    return y;
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
