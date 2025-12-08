import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface OrderItem {
  id: string;
  customer: string;
  phone: string;
  total: number;
  paid: boolean;
  address: string;
  date: string;
  status: string;
  raw: any;
  items?: any[];
}

@Component({
  selector: 'app-orders-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './orders-admin.component.html',
  styleUrls: ['./orders-admin.component.css'],
})
export class OrdersAdminComponent implements OnInit {
  searchText = '';
  orders: OrderItem[] = [];
  filteredOrders: OrderItem[] = [];
  selectedOrder: any = null;
  showModal = false;
  placeholderImage = 'assets/images/default-product.png'; // fallback

  STATUS_MAP: Record<string, string> = {
    PENDING: 'Chờ Xác Nhận',
    PROCESSING: 'Đang Chuẩn Bị Hàng',
    SHIPPED: 'Đang Vận Chuyển',
    DELIVERED: 'Đã Hoàn Thành',
    CANCELLED: 'Đã Hủy',
  };

  STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Chờ Xác Nhận' },
    { value: 'PROCESSING', label: 'Đang Chuẩn Bị Hàng' },
    { value: 'SHIPPED', label: 'Đang Vận Chuyển' },
    { value: 'DELIVERED', label: 'Đã Hoàn Thành' },
    { value: 'CANCELLED', label: 'Đã Hủy' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  getProductImage(item: any): string {
    // ưu tiên Cloudinary, fallback nếu không có ảnh
    if (item.image) {
      return this.isArray(item.image) ? item.image[0] : item.image;
    }
    if (item.variant_id?.image) {
      return this.isArray(item.variant_id.image) ? item.variant_id.image[0] : item.variant_id.image;
    }
    return this.placeholderImage;
  }

  onImageError(event: any) {
    event.target.src = this.placeholderImage;
  }

  loadOrders() {
    this.http.get<any>('http://localhost:3000/api/orders').subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.orders = res.data.map((o: any) => {
            let customer = 'Khách lẻ';
            let phone = '—';
            if (o.user_id) {
              if (o.user_id.email?.trim()) customer = o.user_id.email.trim();
              else if (o.user_id.username?.trim()) customer = o.user_id.username.trim();
              else if (o.user_id.phone) customer = `Khách (${o.user_id.phone})`;
              phone = o.user_id.phone || '—';
            } else if (o.receiver_name || o.receiver_phone) {
              if (o.receiver_name?.trim()) customer = o.receiver_name.trim();
              if (o.receiver_phone) {
                phone = o.receiver_phone;
                if (customer === 'Khách lẻ') customer = `Khách (${o.receiver_phone})`;
              }
            }

            // Chuẩn hóa ảnh sản phẩm
            if (o.items) {
              o.items = o.items.map((i: any) => ({
                ...i,
                image: i.image
                  ? this.isArray(i.image)
                    ? i.image[0]
                    : i.image
                  : i.variant_id?.image
                    ? this.isArray(i.variant_id.image)
                      ? i.variant_id.image[0]
                      : i.variant_id.image
                    : this.placeholderImage
              }));
            }

            let status = o.status;
            if (!(status in this.STATUS_MAP)) status = 'PENDING';

            return {
              id: o.order_code || 'N/A',
              customer,
              phone,
              total: o.total_price || 0,
              paid: o.payment_status === 'PAID',
              address: o.receiver_address || '—',
              date: new Date(o.createdAt).toLocaleDateString('vi-VN'),
              status,
              raw: o,
              items: o.items || []
            };
          });
          this.filteredOrders = [...this.orders];
        }
      },
      error: () => alert('Không thể tải danh sách đơn hàng'),
    });
  }

  onSearch() {
    const kw = this.searchText.toLowerCase().trim();
    if (!kw) {
      this.filteredOrders = [...this.orders];
      return;
    }
    this.filteredOrders = this.orders.filter(
      (o) =>
        o.id.toLowerCase().includes(kw) ||
        o.customer.toLowerCase().includes(kw) ||
        o.phone.includes(kw)
    );
  }

  mapStatus(status: string): string {
    return this.STATUS_MAP[status] || 'Chờ Xác Nhận';
  }

  viewDetails(order: OrderItem) {
    this.http.get<any>(`http://localhost:3000/api/orders/${order.raw._id}`).subscribe({
      next: (res) => {
        const o = res.data;
        if (!(o.status in this.STATUS_MAP)) o.status = 'PENDING';

        // Chuẩn hóa customer + phone
        o.customer = o.receiver_name?.trim() || o.user_id?.username?.trim() || o.user_id?.email?.trim() || 'Khách lẻ';
        o.phone = o.receiver_phone?.trim() || o.user_id?.phone?.trim() || '—';

        // Chuẩn hóa ảnh sản phẩm
        if (o.items) {
         o.items = o.items.map((i: any) => {
  const img = i.image
    ? Array.isArray(i.image) ? i.image[0] : i.image
    : i.variant_id?.image
      ? Array.isArray(i.variant_id.image) ? i.variant_id.image[0] : i.variant_id.image
      : this.placeholderImage;
  return { ...i, imageUrl: img };
});
        }

        this.selectedOrder = o;
        this.showModal = true;
      },
      error: () => alert('Không thể xem chi tiết đơn hàng'),
    });
  }

  closeModal() {
    this.showModal = false;
    this.selectedOrder = null;
  }

  updateStatusFromModal() {
    if (!this.selectedOrder || !this.selectedOrder._id) return;

    const newStatus = this.selectedOrder.status;
    if (!confirm(`Xác nhận đổi trạng thái đơn hàng #${this.selectedOrder.order_code} thành "${this.mapStatus(newStatus)}"?`)) return;

    this.http.put(`http://localhost:3000/api/orders/${this.selectedOrder._id}/status`, { status: newStatus })
      .subscribe({
        next: () => {
          alert('Cập nhật trạng thái thành công!');
          this.closeModal();
          this.loadOrders();
        },
        error: () => alert('Lỗi khi cập nhật trạng thái'),
      });
  }
}
