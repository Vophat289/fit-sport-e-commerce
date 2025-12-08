import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  stats = {
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  };
  
  statsUpdated = {
    users: '',
    products: '',
    orders: '',
    revenue: ''
  };

  chartLabels: string[] = [];
  chartDataNumbers: number[] = [];

  private subscription?: Subscription;
  private chartInstance?: Chart;

  constructor(
    private dashboardService: DashboardService,
    private router: Router      
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
    if (this.chartInstance) this.chartInstance.destroy();
  }

  loadDashboard() {
    this.subscription = this.dashboardService.getDashboardData().subscribe({
      next: (res) => {
        if (res?.success && res.data) {

          const d = res.data;

          this.stats.totalUsers = d.totalUsers;
          this.stats.totalProducts = d.totalProducts;
          this.stats.totalOrders = d.totalOrders;
          this.stats.totalRevenue = d.totalRevenue;

          const u = res.data.updatedAt;
          
          this.statsUpdated.users = this.formatDate(u.users?.updatedAt);
          this.statsUpdated.products = this.formatDate(u.products?.updatedAt);
          this.statsUpdated.orders = this.formatDate(u.orders?.updatedAt);
          this.statsUpdated.revenue = this.formatDate(u.revenue?.updatedAt);

          // Chart data
          this.chartLabels = d.chartData.map((m: any) => m.month);
          this.chartDataNumbers = d.chartData.map((m: any) => m.revenue);

          console.log("Chart Labels:", this.chartLabels);
          console.log("Chart Data:", this.chartDataNumbers);

          setTimeout(() => this.renderChart(), 0);
        }
      },
      error: (err) => console.error(err)
    });
  }


  renderChart() {
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chartInstance) this.chartInstance.destroy();

    const maxRevenue = Math.max(...this.chartDataNumbers, 1);
    const roundedMax = Math.ceil(maxRevenue / 1_000_000) * 1_000_000;
this.chartInstance = new Chart(canvas, {
  type: 'bar',
  data: {
    labels: this.chartLabels,
    datasets: [
      {
        data: this.chartDataNumbers,
        label: 'Doanh thu theo tháng (VND)',
        backgroundColor: '#0077B6',       
        borderColor: '#0077B6',
        borderWidth: 1,
        hoverBackgroundColor: '#0096d1',
        borderRadius: 8
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#808080',      
          padding: 20,
          font: { size: 14 }
        }
      }
    },

    scales: {
      x: {
        ticks: {
          color: '#808080',                     
          font: { size: 13 }
        },
        grid: {
          color: '#808080'        
        }
      },

      y: {
        beginAtZero: true,
        suggestedMax: roundedMax,
        ticks: {
          color: '#808080',                     
          font: { size: 13 },
          callback: (value) => value.toLocaleString('vi-VN')
        },
        grid: {
          color: '#808080'
        }
      }
    },

    layout: {
      padding: 10
    }
  }
});
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Không có dữ liệu';
    return new Date(date).toLocaleDateString('vi-VN');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
}
