import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface SolicitudAcceso {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  rol: string;
  estado_registro: 'pendiente' | 'aprobado' | 'rechazado';
  creado_en: string;
}

@Component({
  selector: 'app-solicitudes-acceso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './solicitudes-acceso.component.html',
  styleUrl: './solicitudes-acceso.component.css'
})
export class SolicitudesAccesoComponent implements OnInit {
  solicitudes: SolicitudAcceso[] = [];
  loading       = false;
  procesando    = new Set<number>();
  estadoFiltro  = 'pendiente';
  filtros       = ['pendiente', 'aprobado', 'rechazado'];
  successMsg    = '';

  private readonly API = `${environment.apiUrl}/solicitudes-acceso`;

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true;
    this.http.get<SolicitudAcceso[]>(`${this.API}?estado=${this.estadoFiltro}`).subscribe({
      next: data => { this.solicitudes = data; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  cambiarFiltro(estado: string): void {
    this.estadoFiltro = estado;
    this.cargar();
  }

  aprobar(id: number): void {
    this.procesando.add(id);
    this.http.patch(`${this.API}/${id}/aprobar`, {}).subscribe({
      next: () => { this.procesando.delete(id); this.mostrarExito('Cuenta aprobada ✅'); this.cargar(); },
      error: ()  => { this.procesando.delete(id); }
    });
  }

  rechazar(id: number): void {
    if (!confirm('¿Rechazar esta solicitud? El usuario no podrá acceder.')) return;
    this.procesando.add(id);
    this.http.patch(`${this.API}/${id}/rechazar`, {}).subscribe({
      next: () => { this.procesando.delete(id); this.mostrarExito('Solicitud rechazada'); this.cargar(); },
      error: ()  => { this.procesando.delete(id); }
    });
  }

  esProcesando(id: number): boolean { return this.procesando.has(id); }

  getInitials(s: SolicitudAcceso): string {
    return `${s.nombre.charAt(0)}${s.apellido.charAt(0)}`.toUpperCase();
  }

  private mostrarExito(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 3000);
  }
}
