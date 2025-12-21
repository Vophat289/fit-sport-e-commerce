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

  /** 🔒 Thứ tự trạng thái hợp lệ (ADMIN) */
  private statusFlow: string[] = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPING',
    'DELIVERED'
  ];

  /** ✅ Admin KHÔNG có CANCELLED */
  statusOptions = [
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'PROCESSING', label: 'Đang xử lý / Chuẩn bị hàng' },
    { value: 'SHIPPING', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Giao hàng thành công' }
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

  /** 🚫 Disable option không hợp lệ */
  isStatusDisabled(targetStatus: string): boolean {
    const currentIndex = this.statusFlow.indexOf(this.order.status);
    const targetIndex = this.statusFlow.indexOf(targetStatus);

    // Không cho quay lại
    if (targetIndex < currentIndex) return true;

    // Không cho nhảy cóc
    if (targetIndex > currentIndex + 1) return true;

    return false;
  }

  /** ✅ Update status đúng flow */
  updateStatus(): void {
    if (this.selectedStatus === this.order.status) return;

    const currentIndex = this.statusFlow.indexOf(this.order.status);
    const newIndex = this.statusFlow.indexOf(this.selectedStatus);

    // 🔒 Chặn nhảy cóc & quay ngược (double check)
    if (newIndex !== currentIndex + 1) {
      this.errorMsg = 'Không thể cập nhật trạng thái không đúng thứ tự xử lý.';
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn chuyển đơn hàng sang trạng thái "${this.getStatusLabel(this.selectedStatus)}"?`)) {
      return;
    }

    this.updating = true;
    this.errorMsg = '';

    this.orderService.updateOrderStatus(this.order._id, this.selectedStatus).subscribe({
      next: () => {
        this.updating = false;
        this.statusUpdated.emit();
      },
      error: (err) => {
        this.updating = false;
        this.errorMsg = err.error?.message || 'Lỗi khi cập nhật trạng thái đơn hàng';
        console.error(err);
      }
    });
  }

  /** ================== UI HELPER ================== */

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      PROCESSING: 'Đang xử lý',
      SHIPPING: 'Đang giao',
      DELIVERED: 'Giao hàng thành công'
    };
    return statusMap[status] || status;
  }

  getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      PENDING: 'bx-time-five',
      CONFIRMED: 'bx-check-circle',
      PROCESSING: 'bx-package',
      SHIPPING: 'bx-truck',
      DELIVERED: 'bx-check-double'
    };
    return iconMap[status] || 'bx-info-circle';
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'badge-warning',
      CONFIRMED: 'badge-info',
      PROCESSING: 'badge-primary',
      SHIPPING: 'badge-success',
      DELIVERED: 'badge-success-dark'
    };
    return statusMap[status] || 'badge-secondary';
  }

  getPaymentStatusBadgeClass(paymentStatus: string): string {
    const statusMap: Record<string, string> = {
      SUCCESS: 'badge-success',
      PENDING: 'badge-warning',
      FAILED: 'badge-danger'
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
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  }
}
