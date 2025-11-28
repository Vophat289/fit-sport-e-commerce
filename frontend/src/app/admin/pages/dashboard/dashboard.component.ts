import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '@app/admin/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit{
  // Thống kê tổng quan (sẽ lấy từ API sau)
  stats = {
    totalUsers: 0,        
    totalOrders: 0,       
    totalRevenue: 15000000, // Tổng doanh thu
    totalProducts: 50      // Tổng số sản phẩm
  };

  // Dữ liệu biểu đồ doanh thu theo 12 tháng (triệu VNĐ)
  chartData = [
    { month: 1, revenue: 1.2 },
    { month: 2, revenue: 1.5 },
    { month: 3, revenue: 2.0 },
    { month: 4, revenue: 2.3 },
    { month: 5, revenue: 3.1 },
    { month: 6, revenue: 2.8 },
    { month: 7, revenue: 2.5 },
    { month: 8, revenue: 2.7 },
    { month: 9, revenue: 3.0 },
    { month: 10, revenue: 2.9 },
    { month: 11, revenue: 3.2 },
    { month: 12, revenue: 2.8 }
  ];

  // Tìm giá trị max để scale biểu đồ
  maxRevenue = Math.max(...this.chartData.map(d => d.revenue));

  constructor(private dashboardService: DashboardService){}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void{
    this.dashboardService.getDashboardData().subscribe({
      next: (response) => {
        if(response.success) {
          //update từ api
          this.stats.totalUsers = response.data.totalUsers;
          this.stats.totalProducts = response.data.totalProducts;
        }
      },
    })
  }

  // Format số tiền theo định dạng Việt Nam (15.000.000)
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value);
  }

  // Tính phần trăm chiều cao cho bar chart
  getBarHeight(revenue: number): number {
    return (revenue / this.maxRevenue) * 100;
  }
}
