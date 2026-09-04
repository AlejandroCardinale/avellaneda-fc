/**
 * ============================================================
 * SOLICITUD COMPONENT — Módulo de Solicitudes
 * ============================================================
 * Permite a los entrenadores (y administradores) hacer pedidos de:
 *   - Indumentaria (camisetas, shorts, medias, etc. con talle y dorsal)
 *   - Equipamiento de entrenamiento (pelotas, arcos, vallas, etc.)
 *   - Transporte (micros/camionetas para viajes)
 *
 * FLUJO DE USO:
 *   1. El usuario elige una pestaña (tab): Indumentaria / Equipamiento / Transporte
 *   2. Completa el formulario con filas dinámicas (puede agregar/quitar ítems)
 *   3. Presiona "Enviar solicitud" → se guarda en la BD con estado 'pendiente'
 *   4. El administrador puede ver y aprobar/rechazar desde el módulo Reportes
 *
 * SEGURIDAD: Si el usuario no está logueado, se redirige al login.
 * ============================================================
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SolicitudesService, Solicitud } from '../../services/solicitudes.service';
import { AuthService } from '../../services/auth.service';

/** Tipo que limita las pestañas válidas del formulario */
type Tab = 'indumentaria' | 'equipamiento' | 'transporte';

/** Talles disponibles para prendas de indumentaria */
const TALLES  = ['XS','S','M','L','XL','XXL'];

/** Opciones predefinidas del selector de tipo de prenda */
const TIPOS_INDUMENTARIA = ['Camiseta de juego','Short','Medias','Buzo','Campera','Conjunto de arquero','Otro'];

/** Opciones predefinidas del selector de equipamiento */
const TIPOS_EQUIPAMIENTO = ['Pelota de fútbol N°5','Pelota de fútbol N°4','Pelota de básquet','Arco','Vallas','Colchoneta','Conos','Pecheras','Escalera de agilidad','Otro'];

/** Tipos de vehículo disponibles para solicitar */
const TIPOS_TRANSPORTE   = ['Micro chico (20 pax)','Micro mediano (40 pax)','Micro grande (60 pax)','Camioneta'];

/** Estructura de una fila de indumentaria en el formulario */
interface FilaIndumentaria {
  tipo: string;         // Seleccionado del dropdown o 'Otro'
  otroTipo: string;     // Texto libre si tipo === 'Otro'
  talle: string;        // XS | S | M | L | XL | XXL
  numeroDorsal: number | null; // Opcional, para camisetas
  cantidad: number;
}

/** Estructura de una fila de equipamiento en el formulario */
interface FilaEquipamiento {
  tipo: string;
  otroTipo: string;
  cantidad: number;
}

@Component({
  selector: 'app-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitud.component.html',
  styleUrl: './solicitud.component.css'
})
export class SolicitudComponent implements OnInit {
  /** Pestaña actualmente visible: indumentaria / equipamiento / transporte */
  tabActiva: Tab = 'indumentaria';

  /** Arrays de opciones expuestos al template para usar en *ngFor */
  talles               = TALLES;
  tiposIndumentaria    = TIPOS_INDUMENTARIA;
  tiposEquipamiento    = TIPOS_EQUIPAMIENTO;
  tiposTransporte      = TIPOS_TRANSPORTE;

  /**
   * Fecha mínima permitida en los campos de fecha.
   * Se calcula como "mañana" para que no se solicite con fecha pasada.
   */
  fechaMin = (() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0]; // Formato YYYY-MM-DD requerido por input[type=date]
  })();

  /** Lista de filas del formulario de indumentaria (empieza con una fila vacía) */
  filasIndum: FilaIndumentaria[] = [this.nuevaFilaIndum()];

  /** Lista de filas del formulario de equipamiento (empieza con una fila vacía) */
  filasEquip: FilaEquipamiento[] = [this.nuevaFilaEquip()];

  /** Datos del formulario de transporte (un solo vehículo por solicitud) */
  transporte = { tipo: TIPOS_TRANSPORTE[0], fecha: '', destino: '', pasajeros: 1, observaciones: '' };

  /** Fecha para la que se necesita indumentaria o equipamiento */
  fechaNecesidad = '';

  /** Observaciones generales opcionales del pedido */
  observacionesGeneral = '';

  // ── Estado de la UI ──────────────────────────────────────
  enviando  = false;           // true mientras espera respuesta del backend
  exito     = false;           // true al recibir confirmación exitosa
  error     = '';              // Mensaje de error visible al usuario
  mostrarHistorial = false;    // Alterna la visibilidad del panel de historial
  historial: Solicitud[] = []; // Lista de solicitudes previas del usuario
  loadingHistorial = false;    // true mientras carga el historial

  constructor(
    private solicitudesService: SolicitudesService,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Se ejecuta al cargar el componente.
   * Verifica que el usuario esté logueado; si no, lo redirige al login.
   */
  ngOnInit() {
    if (!this.authService.isLoggedIn()) { this.router.navigate(['/login']); }
  }

  /** Cambia la pestaña activa y limpia mensajes de error/éxito */
  setTab(tab: Tab) {
    this.tabActiva = tab;
    this.exito = false; this.error = '';
  }

  // ── Gestión de filas de Indumentaria ────────────────────

  /** Crea un objeto de fila con valores por defecto */
  nuevaFilaIndum(): FilaIndumentaria {
    return { tipo: TIPOS_INDUMENTARIA[0], otroTipo: '', talle: 'M', numeroDorsal: null, cantidad: 1 };
  }

  /** Agrega una nueva fila vacía al formulario de indumentaria */
  agregarFilaIndum()  { this.filasIndum.push(this.nuevaFilaIndum()); }

  /** Elimina la fila en el índice dado (mínimo 1 fila) */
  quitarFilaIndum(i: number) { if (this.filasIndum.length > 1) this.filasIndum.splice(i, 1); }

  // ── Gestión de filas de Equipamiento ────────────────────

  nuevaFilaEquip(): FilaEquipamiento {
    return { tipo: TIPOS_EQUIPAMIENTO[0], otroTipo: '', cantidad: 1 };
  }
  agregarFilaEquip()  { this.filasEquip.push(this.nuevaFilaEquip()); }
  quitarFilaEquip(i: number) { if (this.filasEquip.length > 1) this.filasEquip.splice(i, 1); }

  // ── Envío del formulario ─────────────────────────────────

  /**
   * Valida el formulario y lo envía al backend.
   *
   * Validaciones:
   *   - Para indumentaria/equipamiento: fecha_necesidad obligatoria
   *   - Para transporte: fecha y destino obligatorios
   *
   * Construcción del payload:
   *   - Mapea las filas a ítems con nombre libre
   *   - Si el tipo es 'Otro', usa el campo otroTipo como nombre
   *   - Llama a SolicitudesService.crearSolicitud() que hace POST /api/solicitudes
   *
   * Al recibir respuesta exitosa:
   *   - Muestra mensaje de éxito
   *   - Resetea todos los formularios a su estado inicial
   *   - Recarga el historial si está visible
   */
  enviarSolicitud() {
    this.error = ''; this.exito = false;

    // Validaciones
    if (this.tabActiva !== 'transporte' && !this.fechaNecesidad) {
      this.error = 'Indicá para qué fecha necesitás los ítems.'; return;
    }
    if (this.tabActiva === 'transporte') {
      if (!this.transporte.fecha)   { this.error = 'Indicá la fecha del viaje.'; return; }
      if (!this.transporte.destino.trim()) { this.error = 'Indicá el destino.'; return; }
    }

    let items: any[];
    let tipo: Tab;
    let fecha_necesidad: string;
    let destino: string | undefined;
    let pasajeros: number | undefined;
    let observaciones: string | undefined;

    if (this.tabActiva === 'indumentaria') {
      tipo = 'indumentaria'; fecha_necesidad = this.fechaNecesidad;
      observaciones = this.observacionesGeneral || undefined;
      // Mapea cada fila al formato que espera el backend
      items = this.filasIndum.map(f => ({
        nombre:        f.tipo === 'Otro' ? (f.otroTipo || 'Indumentaria') : f.tipo,
        talle:         f.talle,
        numero_dorsal: f.numeroDorsal || undefined,
        cantidad:      f.cantidad
      }));
    } else if (this.tabActiva === 'equipamiento') {
      tipo = 'equipamiento'; fecha_necesidad = this.fechaNecesidad;
      observaciones = this.observacionesGeneral || undefined;
      items = this.filasEquip.map(f => ({
        nombre:   f.tipo === 'Otro' ? (f.otroTipo || 'Equipamiento') : f.tipo,
        cantidad: f.cantidad
      }));
    } else {
      // Transporte: un único ítem con el tipo de vehículo
      tipo = 'transporte'; fecha_necesidad = this.transporte.fecha;
      destino    = this.transporte.destino;
      pasajeros  = this.transporte.pasajeros;
      observaciones = this.transporte.observaciones || undefined;
      items = [{ nombre: this.transporte.tipo, cantidad: 1 }];
    }

    this.enviando = true;
    this.solicitudesService.crearSolicitud({ tipo, fecha_necesidad, destino, pasajeros, observaciones, items }).subscribe({
      next: () => {
        this.enviando = false; this.exito = true;
        // Resetear formularios a estado inicial
        this.filasIndum = [this.nuevaFilaIndum()];
        this.filasEquip = [this.nuevaFilaEquip()];
        this.fechaNecesidad = ''; this.observacionesGeneral = '';
        this.transporte = { tipo: TIPOS_TRANSPORTE[0], fecha:'', destino:'', pasajeros:1, observaciones:'' };
        if (this.mostrarHistorial) this.cargarHistorial(); // Actualiza historial si está abierto
      },
      error: (err) => {
        this.enviando = false;
        this.error = err?.error?.message || 'Error al enviar la solicitud.';
      }
    });
  }

  // ── Historial ────────────────────────────────────────────

  /** Muestra/oculta el panel de historial. Carga los datos la primera vez que se abre. */
  toggleHistorial() {
    this.mostrarHistorial = !this.mostrarHistorial;
    if (this.mostrarHistorial && this.historial.length === 0) this.cargarHistorial();
  }

  /** Hace GET /api/solicitudes/mias y guarda los resultados en this.historial */
  cargarHistorial() {
    this.loadingHistorial = true;
    this.solicitudesService.getMisSolicitudes().subscribe({
      next: d  => { this.historial = d; this.loadingHistorial = false; },
      error: () => { this.loadingHistorial = false; }
    });
  }

  /**
   * Devuelve la clase CSS correcta del badge según el estado de la solicitud.
   * Se usa en el template con [ngClass]="estadoBadge(sol.estado)"
   */
  estadoBadge(e: string) {
    return { pendiente:'badge-pending', aprobada:'badge-success', rechazada:'badge-danger', entregada:'badge-delivered' }[e] ?? '';
  }
}
