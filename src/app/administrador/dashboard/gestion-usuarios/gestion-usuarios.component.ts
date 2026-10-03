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
  editableRoles = [
    { value: 'administrador', label: 'Administrador' },
    { value: 'entrenador', label: 'Entrenador' },
    { value: 'atleta', label: 'Atleta' }
  ];
  loading = false;
  saving = false;
  deleting = false;
  modalError = '';
  selectedUser: Usuario | null = null;
  editUser: Usuario | null = null;
  deleteUser: Usuario | null = null;
  editValues = { rol: 'atleta', activo: true };

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

  ver(usuario: Usuario): void {
    this.selectedUser = { ...usuario };
  }

  cerrarDetalle(): void {
    this.selectedUser = null;
  }

  toggleActivo(usuario: Usuario): void {
    this.usuariosService.toggleActivo(usuario.id, !usuario.activo).subscribe({
      next: () => this.loadUsers(),
      error: () => this.loadUsers()
    });
  }

  abrirEdicion(usuario: Usuario): void {
    this.editUser = usuario;
    this.editValues = { rol: usuario.rol.toLowerCase(), activo: usuario.activo };
    this.modalError = '';
  }

  cerrarEdicion(): void {
    if (this.saving) return;
    this.editUser = null;
    this.modalError = '';
  }

  guardarEdicion(): void {
    if (!this.editUser || this.saving) return;
    this.saving = true;
    this.modalError = '';
    this.usuariosService.updateRoleAndStatus(this.editUser.id, this.editValues).subscribe({
      next: () => {
        this.saving = false;
        this.editUser = null;
        this.loadUsers();
      },
      error: (error) => {
        this.saving = false;
        this.modalError = error?.error?.message || 'No se pudo actualizar el usuario.';
      }
    });
  }

  solicitarEliminacion(usuario: Usuario): void {
    this.deleteUser = usuario;
    this.modalError = '';
  }

  cancelarEliminacion(): void {
    if (this.deleting) return;
    this.deleteUser = null;
    this.modalError = '';
  }

  confirmarEliminacion(): void {
    if (!this.deleteUser || this.deleting) return;
    this.deleting = true;
    this.modalError = '';
    this.usuariosService.delete(this.deleteUser.id).subscribe({
      next: () => {
        this.deleting = false;
        this.deleteUser = null;
        this.loadUsers();
      },
      error: (error) => {
        this.deleting = false;
        this.modalError = error?.error?.message || 'No se pudo eliminar el usuario.';
      }
    });
  }
}
