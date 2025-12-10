import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderAdminService, OrderDetail } from '../../services/order-admin.service';

@Component({
  selector: 'app-order-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-detail-modal.component.html',
  styleUrls: ['./order-detail-modal.component.css']
})
export class OrderDetailModalComponent implements OnInit {
  @Input() order!: OrderDetail;
  @Output() close = new EventEmitter<void>();
  @Output() statusUpdated = new EventEmitter<void>();

  selectedStatus: string = '';
  updating = false;
  errorMsg = '';

  statusOptions = [
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'PROCESSING', label: 'Đang xử lý / Chuẩn bị hàng' },
    { value: 'SHIPPING', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Giao hàng thành công' },
    { value: 'CANCELLED', label: 'Đã hủy' }
  ];

  constructor(private orderService: OrderAdminService) {}

  ngOnInit(): void {
    this.selectedStatus = this.order.status;
  }

  closeModal(): void {
    this.close.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  updateStatus(): void {
    if (this.selectedStatus === this.order.status) {
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn thay đổi trạng thái đơn hàng thành "${this.getStatusLabel(this.selectedStatus)}"?`)) {
      return;
    }

    this.updating = true;
    this.errorMsg = '';

    this.orderService.updateOrderStatus(this.order._id, this.selectedStatus).subscribe({
      next: (res) => {
        this.updating = false;
        alert('Cập nhật trạng thái đơn hàng thành công!');
        this.statusUpdated.emit();
      },
      error: (err) => {
        this.updating = false;
        this.errorMsg = err.error?.message || 'Lỗi khi cập nhật trạng thái đơn hàng';
        console.error('Lỗi khi cập nhật trạng thái:', err);
      }
    });
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
