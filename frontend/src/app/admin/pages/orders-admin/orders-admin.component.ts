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

  // ĐẢM BẢO FILE NÀY TỒN TẠI Ở src/assets/images/default-product.png
  placeholderImage = 'assets/images/default-product.png';

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

  // optional cache để trả cùng 1 string cho cùng 1 item (giảm khả năng thay đổi ref)
  private imageCache = new WeakMap<object, string>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  /** 
   * Lấy ảnh sản phẩm — trả 1 URL cố định. Có cache để tránh trả khác ref cho cùng 1 item.
   */
  getProductImage(item: any): string {
    if (!item) return this.placeholderImage;

    // nếu đã cache, return luôn
    const cached = this.imageCache.get(item);
    if (cached) return cached;

    let result = this.placeholderImage;

    // item.image là array
    if (item.image && Array.isArray(item.image) && item.image.length > 0) {
      result = item.image[0];
    } else if (item.image && typeof item.image === 'string') {
      result = item.image;
    } else if (item.variant_id?.image) {
      if (Array.isArray(item.variant_id.image) && item.variant_id.image.length > 0)
        result = item.variant_id.image[0];
      else if (typeof item.variant_id.image === 'string')
        result = item.variant_id.image;
    }

    // Normalize: nếu result rỗng/null -> placeholder
    if (!result || typeof result !== 'string' || result.trim() === '') {
      result = this.placeholderImage;
    }

    // Nếu result là tên file chứ không phải url, ông chủ có thể cần prefix cloudinary:
    // if (!result.startsWith('http')) result = `https://res.cloudinary.com/<cloud_name>/image/upload/${result}`;

    this.imageCache.set(item, result);
    return result;
  }

  /**
   * Fallback khi lỗi ảnh: chỉ set src 1 lần và disable handler để tránh loop.
   */
  onImageError(event: any) {
    try {
      const img: HTMLImageElement = event.target;
      if (!img) return;
      // Nếu đã là placeholder thì thôi
      if (img.src && img.src.includes(this.placeholderImage)) return;

      // Ngăn chặn vòng lặp: remove handler trước khi set src
      img.onerror = null;
      img.src = this.placeholderImage;
    } catch (e) {
      // ignore
    }
  }

  /** Load danh sách đơn hàng */
  loadOrders() {
    this.http.get<any>('http://localhost:3000/api/orders').subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.orders = res.data.map((o: any) => {
            let customer = 'Khách lẻ';
            let phone = '—';

            if (o.user_id) {
              customer = o.user_id.email?.trim() || o.user_id.username?.trim() || 'Khách';
              phone = o.user_id.phone || '—';
            } else if (o.receiver_name || o.receiver_phone) {
              customer = o.receiver_name?.trim() || `Khách (${o.receiver_phone})`;
              phone = o.receiver_phone || '—';
            }

            const status = o.status in this.STATUS_MAP ? o.status : 'PENDING';

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
              items: o.items || [],
            };
          });

          this.filteredOrders = [...this.orders];
        }
      },
      error: () => alert('Không thể tải danh sách đơn hàng'),
    });
  }

  /** Tìm kiếm đơn hàng */
  onSearch() {
    const kw = this.searchText.toLowerCase().trim();
    this.filteredOrders = kw
      ? this.orders.filter(o =>
          o.id.toLowerCase().includes(kw) ||
          o.customer.toLowerCase().includes(kw) ||
          o.phone.includes(kw)
        )
      : [...this.orders];
  }

  /** Map trạng thái sang tiếng Việt */
  mapStatus(status: string): string {
    return this.STATUS_MAP[status] || 'Chờ Xác Nhận';
  }

  /** Xem chi tiết đơn hàng */
  viewDetails(order: OrderItem) {
    this.http.get<any>(`http://localhost:3000/api/orders/${order.raw._id}`).subscribe({
      next: (res) => {
        const o = res.data;

        if (!(o.status in this.STATUS_MAP)) o.status = 'PENDING';

        o.customer = o.receiver_name?.trim() ||
                     o.user_id?.username?.trim() ||
                     o.user_id?.email?.trim() ||
                     'Khách lẻ';

        o.phone = o.receiver_phone?.trim() ||
                  o.user_id?.phone?.trim() ||
                  '—';

        // KHÔNG map lại items ở đây — chỉ đảm bảo tồn tại mảng
        o.items = o.items || [];

        // reset cache khi đổi order mới (để tránh giữ ref cũ)
        this.imageCache = new WeakMap<object, string>();

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

  /** Cập nhật trạng thái */
  updateStatusFromModal() {
    if (!this.selectedOrder || !this.selectedOrder._id) return;

    const newStatus = this.selectedOrder.status;
    if (!confirm(`Xác nhận đổi trạng thái đơn hàng #${this.selectedOrder.order_code} thành "${this.mapStatus(newStatus)}"?`))
      return;

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

  /** trackBy để Angular không phá DOM → ảnh không chớp */
  trackByItem(index: number, item: any) {
    // ưu tiên id trong DB, fallback index
    return item._id || item.id || index;
  }
}
