import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService, Usuario } from '../../../services/usuarios.service';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-usuarios.component.html',
  styleUrl: './gestion-usuarios.component.css'
})
export class GestionUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  total = 0;
  page = 1;
  pageSize = 8;
  totalPages = 1;
  search = '';
  selectedRole = 'Todos';
  roles = ['Todos', 'Administrador', 'Entrenador', 'Atleta'];
  loading = false;

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.usuariosService.getUsuariosPage({
      rol: this.selectedRole === 'Todos' ? undefined : this.selectedRole,
      search: this.search,
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: (response) => {
        this.usuarios = response.data;
        this.total = response.total;
        this.page = response.page;
        this.pageSize = response.pageSize;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.usuarios = [];
      }
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadUsers();
  }

  onRoleChange(): void {
    this.page = 1;
    this.loadUsers();
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page += 1;
      this.loadUsers();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page -= 1;
      this.loadUsers();
    }
  }

  goToPage(target: number): void {
    if (target >= 1 && target <= this.totalPages) {
      this.page = target;
      this.loadUsers();
    }
  }

  getInitials(user: Usuario): string {
    const first = user.nombre?.charAt(0)?.toUpperCase() || 'U';
    const last = user.apellido?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}`;
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'administrador': return 'role role-admin';
      case 'entrenador': return 'role role-coach';
      case 'atleta': return 'role role-athlete';
      default: return 'role';
    }
  }

  getEstadoClass(activo: boolean): string {
    return activo ? 'status status-active' : 'status status-inactive';
  }

  toggleActivo(usuario: Usuario): void {
    this.usuariosService.toggleActivo(usuario.id, !usuario.activo).subscribe({
      next: () => this.loadUsers(),
      error: () => this.loadUsers()
    });
  }

  eliminarUsuario(id: number): void {
    if (!confirm('¿Eliminar este usuario?')) return;
    this.usuariosService.delete(id).subscribe({
      next: () => this.loadUsers(),
      error: () => this.loadUsers()
    });
  }
}
