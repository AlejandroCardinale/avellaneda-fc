import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventsService, Event } from '../../../services/events.service';

@Component({
  selector: 'app-gestion-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './eventos.component.html',
  styleUrl: './eventos.component.css'
})
export class GestionEventosComponent implements OnInit {
  form!: FormGroup;
  events: Event[] = [];
  selected: Event | null = null;
  editing: Event | null = null;
  deleting: Event | null = null;

  modalOpen = false;
  detailOpen = false;
  confirmOpen = false;
  loading = false;
  listLoading = false;

  search = '';
  selectedCategoria = 'todas';
  publicadoFiltro = 'todos';
  viewMode: 'grid' | 'table' = 'grid';

  errorMessage = '';
  successMessage = '';

  selectedFile: File | null = null;
  imagePreview = '';

  categoriasDisponibles = ['Sociales', 'Deportivos', 'Torneos', 'Institucionales', 'Culturales'];
  disciplinasComunes = ['Social', 'Fútbol', 'Natación', 'Tenis', 'Básquet', 'Vóley', 'Atletismo', 'Artes Marciales', 'Recreación', 'Institucional'];

  constructor(
    private fb: FormBuilder,
    private eventsService: EventsService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(120)]],
      categoria: ['Sociales', Validators.required],
      disciplina: ['Social', Validators.required],
      fecha: ['', Validators.required],
      hora: ['19:00', Validators.required],
      hora_fin: ['21:00 hs'],
      lugar: ['', Validators.required],
      lugar_detalle: [''],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      descripcion_larga: [''],
      cronograma: [''],
      categorias_participantes: [''],
      inscripcion_abierta: [true],
      inscripcion_limite: [''],
      inscripcion_contacto: ['eventos@avellanedafc.com'],
      reglas: [''],
      premios: [''],
      publicado: [true],
      destacado: [false]
    });

    this.load();
  }

  get f() {
    return this.form.controls;
  }

  get totalEvents(): number {
    return this.events.length;
  }

  get publishedCount(): number {
    return this.events.filter(e => e.publicado !== false).length;
  }

  get upcomingCount(): number {
    const today = new Date().toISOString().slice(0, 10);
    return this.events.filter(e => e.isoDate >= today).length;
  }

  get folkloricCount(): number {
    return this.events.filter(e => (e.title || e.titulo || '').toLowerCase().includes('peña')).length;
  }

  load(): void {
    this.listLoading = true;
    this.eventsService.getAll({
      search: this.search.trim(),
      categoria: this.selectedCategoria,
      publicado: this.publicadoFiltro
    }).subscribe({
      next: (data) => {
        this.events = data.sort((a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime());
        this.listLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar eventos:', err);
        this.errorMessage = err?.error?.message || 'No se pudieron cargar los eventos desde MySQL.';
        this.listLoading = false;
      }
    });
  }

  onSearch(): void {
    this.load();
  }

  openNew(): void {
    this.editing = null;
    this.selectedFile = null;
    this.imagePreview = '';
    this.errorMessage = '';
    this.successMessage = '';

    const todayStr = new Date().toISOString().slice(0, 10);

    this.form.reset({
      titulo: '',
      categoria: 'Sociales',
      disciplina: 'Social',
      fecha: todayStr,
      hora: '19:00',
      hora_fin: '21:00 hs',
      lugar: 'Sede Central',
      lugar_detalle: '',
      descripcion: '',
      descripcion_larga: '',
      cronograma: '',
      categorias_participantes: 'Socios y familias\nAbierto a la comunidad',
      inscripcion_abierta: true,
      inscripcion_limite: 'Mismo día del evento',
      inscripcion_contacto: 'eventos@avellanedafc.com',
      reglas: '',
      premios: '',
      publicado: true,
      destacado: false
    });
    this.modalOpen = true;
  }

  edit(ev: Event): void {
    this.editing = ev;
    this.selectedFile = null;
    this.imagePreview = ev.image || ev.imagen_url || '';
    this.errorMessage = '';
    this.successMessage = '';

    let dateVal = ev.isoDate || '';
    let timeVal = '19:00';
    if (ev.fecha_hora) {
      const parts = ev.fecha_hora.split(' ');
      if (parts[0]) dateVal = parts[0];
      if (parts[1]) timeVal = parts[1].slice(0, 5);
    } else if (ev.time) {
      timeVal = ev.time.replace(' hs', '').trim();
    }

    const cronoLines = Array.isArray(ev.schedule)
      ? ev.schedule.map(s => `${s.time} - ${s.activity}`).join('\n')
      : (Array.isArray(ev.cronograma) ? ev.cronograma.map(s => `${s.time} - ${s.activity}`).join('\n') : '');

    const catLines = Array.isArray(ev.categories)
      ? ev.categories.join('\n')
      : (Array.isArray(ev.categorias_participantes) ? ev.categorias_participantes.join('\n') : '');

    const ruleLines = Array.isArray(ev.rules)
      ? ev.rules.join('\n')
      : (Array.isArray(ev.reglas) ? ev.reglas.join('\n') : '');

    const prizeLines = Array.isArray(ev.prizes)
      ? ev.prizes.join('\n')
      : (Array.isArray(ev.premios) ? ev.premios.join('\n') : '');

    this.form.patchValue({
      titulo: ev.title || ev.titulo || '',
      categoria: ev.category || ev.categoria || 'Sociales',
      disciplina: ev.discipline || ev.disciplina || 'Social',
      fecha: dateVal,
      hora: timeVal,
      hora_fin: ev.endTime || ev.hora_fin || '',
      lugar: ev.location || ev.lugar || '',
      lugar_detalle: ev.locationDetail || ev.lugar_detalle || '',
      descripcion: ev.description || ev.descripcion || '',
      descripcion_larga: ev.longDescription || ev.descripcion_larga || '',
      cronograma: cronoLines,
      categorias_participantes: catLines,
      inscripcion_abierta: ev.inscription ? ev.inscription.open : (ev.inscripcion_abierta !== false),
      inscripcion_limite: ev.inscription ? ev.inscription.deadline : (ev.inscripcion_limite || ''),
      inscripcion_contacto: ev.inscription ? ev.inscription.contact : (ev.inscripcion_contacto || ''),
      reglas: ruleLines,
      premios: prizeLines,
      publicado: ev.publicado !== false,
      destacado: Boolean(ev.destacado)
    });

    this.modalOpen = true;
  }

  view(ev: Event): void {
    this.selected = ev;
    this.detailOpen = true;
  }

  closeDetail(): void {
    this.selected = null;
    this.detailOpen = false;
  }

  askDelete(ev: Event): void {
    this.deleting = ev;
    this.confirmOpen = true;
  }

  cancelDelete(): void {
    this.deleting = null;
    this.confirmOpen = false;
  }

  confirmDelete(): void {
    if (!this.deleting) return;
    this.eventsService.eliminar(this.deleting.id).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Evento eliminado con éxito.';
        this.cancelDelete();
        this.load();
      },
      error: (err) => {
        console.error('Error al eliminar evento:', err);
        this.errorMessage = err?.error?.message || 'No se pudo eliminar el evento.';
        this.cancelDelete();
      }
    });
  }

  closeModal(): void {
    if (!this.loading) {
      this.modalOpen = false;
      this.editing = null;
    }
  }

  onImageSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const val = this.form.value;
    const fechaHora = `${val.fecha} ${val.hora ? val.hora + ':00' : '19:00:00'}`;

    const formData = new FormData();
    formData.append('titulo', val.titulo);
    formData.append('categoria', val.categoria);
    formData.append('disciplina', val.disciplina);
    formData.append('fecha_hora', fechaHora);
    formData.append('hora_fin', val.hora_fin || '');
    formData.append('lugar', val.lugar);
    formData.append('lugar_detalle', val.lugar_detalle || '');
    formData.append('descripcion', val.descripcion);
    formData.append('descripcion_larga', val.descripcion_larga || val.descripcion);
    formData.append('cronograma', val.cronograma || '');
    formData.append('categorias_participantes', val.categorias_participantes || '');
    formData.append('inscripcion_abierta', String(val.inscripcion_abierta));
    formData.append('inscripcion_limite', val.inscripcion_limite || '');
    formData.append('inscripcion_contacto', val.inscripcion_contacto || '');
    formData.append('reglas', val.reglas || '');
    formData.append('premios', val.premios || '');
    formData.append('publicado', String(val.publicado));
    formData.append('destacado', String(val.destacado));

    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    } else if (this.editing && (this.editing.image || this.editing.imagen_url)) {
      formData.append('imagen_url', this.editing.image || this.editing.imagen_url || '');
    }

    if (this.editing) {
      this.eventsService.actualizar(this.editing.id, formData).subscribe({
        next: (res) => {
          this.loading = false;
          this.successMessage = res.message || 'Evento actualizado exitosamente.';
          this.closeModal();
          this.load();
        },
        error: (err) => {
          this.loading = false;
          console.error('Error al actualizar evento:', err);
          this.errorMessage = err?.error?.message || 'No se pudo actualizar el evento.';
        }
      });
    } else {
      this.eventsService.crear(formData).subscribe({
        next: (res) => {
          this.loading = false;
          this.successMessage = res.message || 'Evento registrado exitosamente en MySQL.';
          this.closeModal();
          this.load();
        },
        error: (err) => {
          this.loading = false;
          console.error('Error al registrar evento:', err);
          this.errorMessage = err?.error?.message || 'No se pudo registrar el evento.';
        }
      });
    }
  }
}
