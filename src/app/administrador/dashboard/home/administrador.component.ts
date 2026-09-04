import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminDashboardService, AdminDashboardResponse } from '../../../services/admin-dashboard.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-administrador',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './administrador.component.html',
  styleUrl: './administrador.component.css'
})
export class AdministradorComponent implements OnInit {
  dashboard!: AdminDashboardResponse;
  loading = true;
  error = '';

  constructor(
    private dashboardService: AdminDashboardService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isAdmin()) {
      this.router.navigate(['/inicio']);
      return;
    }

    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el dashboard administrativo.';
        this.loading = false;
      }
    });
  }

  get maxChartValue(): number {
    if (!this.dashboard?.chart?.length) return 1;
    return Math.max(...this.dashboard.chart.map(item => item.total), 1);
  }

  formatVariation(value: number): string {
    if (value === 0) return '0%';
    return `${value > 0 ? '+' : ''}${value}%`;
  }
}
