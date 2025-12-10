import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderAdminService, Order, OrderDetail } from '../../services/order-admin.service';
import { OrderDetailModalComponent } from '../order-detail-modal/order-detail-modal.component';

@Component({
  selector: 'app-order-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, OrderDetailModalComponent],
  templateUrl: './order-admin.component.html',
  styleUrls: ['./order-admin.component.css']
})
export class OrderAdminComponent implements OnInit {
  orders: Order[] = [];
  loading = false;
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 0;
  
  // Filters
  search = '';
  statusFilter = '';
  paymentStatusFilter = '';
  paymentMethodFilter = '';
  
  // Modal
  selectedOrder: OrderDetail | null = null;
  showDetailModal = false;
  
  // Status options
  statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'PROCESSING', label: 'Đang xử lý' },
    { value: 'SHIPPING', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Giao hàng thành công' },
    { value: 'CANCELLED', label: 'Đã hủy' }
  ];
  
  paymentStatusOptions = [
    { value: '', label: 'Tất cả thanh toán' },
    { value: 'SUCCESS', label: 'Thành công' },
    { value: 'PENDING', label: 'Chờ thanh toán' },
    { value: 'FAILED', label: 'Thất bại' }
  ];
  
  paymentMethodOptions = [
    { value: '', label: 'Tất cả phương thức' },
    { value: 'VNPAY', label: 'VNPay' },
    { value: 'COD', label: 'COD' }
  ];

  constructor(private orderService: OrderAdminService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getOrders({
      page: this.page,
      limit: this.pageSize,
      status: this.statusFilter || undefined,
      payment_status: this.paymentStatusFilter || undefined,
      payment_method: this.paymentMethodFilter || undefined,
      search: this.search || undefined
    }).subscribe({
      next: (res) => {
        this.orders = res.orders;
        this.total = res.total;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải đơn hàng:', err);
        this.loading = false;
        alert('Lỗi khi tải danh sách đơn hàng');
      }
    });
  }

  onSearchChange(): void {
    this.page = 1;
    this.loadOrders();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadOrders();
  }

  resetFilters(): void {
    this.search = '';
    this.statusFilter = '';
    this.paymentStatusFilter = '';
    this.paymentMethodFilter = '';
    this.page = 1;
    this.loadOrders();
  }

  openOrderDetail(orderId: string): void {
    this.loading = true;
    this.orderService.getOrderDetail(orderId).subscribe({
      next: (res) => {
        this.selectedOrder = res.order;
        this.showDetailModal = true;
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải chi tiết đơn hàng:', err);
        this.loading = false;
        alert('Lỗi khi tải chi tiết đơn hàng');
      }
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedOrder = null;
  }

  onStatusUpdated(): void {
    // Reload orders after status update
    this.loadOrders();
    this.closeDetailModal();
  }

  changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages) return;
    this.page = newPage;
    this.loadOrders();
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'badge-warning',
      'CONFIRMED': 'badge-info',
      'PROCESSING': 'badge-primary',
      'SHIPPING': 'badge-success',
      'DELIVERED': 'badge-success-dark',
      'CANCELLED': 'badge-danger'
    };
    return statusMap[status] || 'badge-secondary';
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Chờ xác nhận',
      'CONFIRMED': 'Đã xác nhận',
      'PROCESSING': 'Đang xử lý',
      'SHIPPING': 'Đang giao',
      'DELIVERED': 'Giao hàng thành công',
      'CANCELLED': 'Đã hủy'
    };
    return statusMap[status] || status;
  }

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      'PENDING': 'bx-time-five',
      'CONFIRMED': 'bx-check-circle',
      'PROCESSING': 'bx-package',
      'SHIPPING': 'bx-truck',
      'DELIVERED': 'bx-check-double',
      'CANCELLED': 'bx-x-circle'
    };
    return iconMap[status] || 'bx-info-circle';
  }

  getPaymentStatusBadgeClass(paymentStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'SUCCESS': 'badge-success',
      'PENDING': 'badge-warning',
      'FAILED': 'badge-danger'
    };
    return statusMap[paymentStatus] || 'badge-secondary';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}
