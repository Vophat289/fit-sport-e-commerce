// src/app/pages/account-page/account-page.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { NgForm } from '@angular/forms';
import {
  AccountService,
  UserProfile,
  Address,
  Order,
  Voucher,
  SimpleProductDetail,
  ProductVariant,
} from '../../services/account.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.css'],
})
export class AccountPageComponent implements OnInit {
  @ViewChild('profileForm') profileForm!: NgForm;
  currentTab: 'profile' | 'orders' | 'vouchers' | 'address' = 'profile';
  isEditing: boolean = false; // PROFILE

  userInfo: UserProfile = {
    name: 'Loading...',
    email: '',
    phone: '',
    gender: '',
    dob: '',
  };
  editData: UserProfile = {
    name: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
  };
  userAvatarUrl: string = 'assets/images/default-avatar.png';

  addresses: Address[] = [];
  selectedAddressId: string | null = null;
  isAddressModalOpen: boolean = false;
  editingAddress?: Address;

  orders: Order[] = [];
  selectedOrder?: Order;
  ordersLimit: number = 3;
  orderFilter: 'ALL' | string = 'ALL';
  selectedOrderItems: any[] = [];
  productImageCache: { [productId: string]: SimpleProductDetail } = {};

  vouchers: Voucher[] = [];
  voucherFilter: 'ALL' | string = 'ALL';
  showAllVouchers: boolean = false;

  constructor(
    private accountService: AccountService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Kiểm tra đăng nhập
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    } // 2. Lấy payload ban đầu

    const payload = this.accountService.getPayload();
    if (payload) {
      this.userInfo = {
        ...this.userInfo,
        name: payload.name || this.userInfo.name,
        email: payload.email || this.userInfo.email,
      };
      this.editData = { ...this.userInfo };
    } // 3. Tải dữ liệu ban đầu

    this.loadProfile();
    this.loadAddresses();
    this.loadOrders();
    this.loadVouchers();
  }

  loadProfile(): void {
    this.accountService.getProfile().subscribe({
      next: (data) => {
        this.userInfo = {
          ...this.userInfo,
          name: data.name || this.userInfo.name,
          email: data.email || this.userInfo.email,
          phone: data.phone || this.userInfo.phone,
          gender: data.gender || this.userInfo.gender,
          dob: data.dob || this.userInfo.dob,
        };
        this.editData = { ...this.userInfo };
      },
      error: (err: HttpErrorResponse) => {
        console.error('Lỗi khi tải Profile:', err);
        if (err.status === 401) {
          localStorage.removeItem('token');
          alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          this.router.navigate(['/home']);
        }
      },
    });
  }

  enterEditMode(): void {
    this.isEditing = true;
    this.editData = { ...this.userInfo };
  }

  cancelEdit(): void {
    this.editData = { ...this.userInfo };
    this.isEditing = false;
  }

  saveChanges(): void {
    if (!this.isEditing) return;

    this.accountService.updateProfile(this.editData).subscribe({
      next: (data) => {
        this.userInfo = data;
        this.editData = { ...data };
        this.isEditing = false;
        alert('Cập nhật hồ sơ thành công!');
      },
      error: (err: HttpErrorResponse) => {
        console.error('Lỗi khi cập nhật hồ sơ:', err);
        const errorMessage = err.error?.message || 'Cập nhật hồ sơ thất bại.';
        alert(errorMessage);
      },
    });
  }

  logout(): void {
    this.authService.logout();
    localStorage.removeItem('token');
    this.router.navigate(['/home']);
  }

  selectTab(tab: 'profile' | 'orders' | 'vouchers' | 'address'): void {
    this.currentTab = tab;
    this.isEditing = false;
    this.selectedOrder = undefined;
    this.ordersLimit = 3;
    if (tab === 'orders' && this.orders.length === 0) {
      this.loadOrders();
    }
    if (tab === 'address') {
      this.loadAddresses();
    }
  } // ADDRESS METHODS
  loadAddresses(): void {
    this.accountService.getAddresses().subscribe({
      next: (data) => {
        this.addresses = data;
        const defaultAddress = data.find((a) => a.isDefault);
        this.selectedAddressId = defaultAddress?._id ?? data[0]?._id ?? null;
      },
      error: (err) => console.error('Lỗi khi tải Addresses:', err),
    });
  }

  selectAddress(id: string): void {
    this.selectedAddressId = id;
  }

  openAddAddressModal(): void {
    this.editingAddress = {
      receiverName: '',
      phone: '',
      street: '',
      ward: '',
      district: '',
      province: '',
      isDefault: false,
    } as Address;
    this.isAddressModalOpen = true;
  }

  openEditAddressModal(address: Address): void {
    this.editingAddress = { ...address };
    this.isAddressModalOpen = true;
  }

  closeAddressModal(): void {
    this.isAddressModalOpen = false;
    this.editingAddress = undefined;
  }

  saveAddress(): void {
    if (!this.editingAddress) return;

    const isNew = !this.editingAddress._id;
    const apiCall: Observable<Address> = isNew
      ? this.accountService.createAddress(this.editingAddress)
      : this.accountService.updateAddress(this.editingAddress);

    apiCall.subscribe({
      next: () => {
        this.loadAddresses();
        this.closeAddressModal();
        alert(`Địa chỉ đã được ${isNew ? 'thêm mới' : 'cập nhật'} thành công!`);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Lỗi khi lưu địa chỉ:', err);
        const errorMessage =
          err.error?.message || 'Lưu địa chỉ thất bại. Vui lòng thử lại.';
        alert(errorMessage);
      },
    });
  }

  deleteAddress(id: string): void {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;

    this.accountService.deleteAddress(id).subscribe({
      next: () => {
        alert('Địa chỉ đã được xóa.');
        this.loadAddresses();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Lỗi khi xóa địa chỉ:', err);
        const errorMessage =
          err.error?.message || 'Xóa địa chỉ thất bại. Vui lòng thử lại.';
        alert(errorMessage);
      },
    });
  } // ORDERS METHODS
  loadOrders(): void {
    this.accountService.getOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.loadFirstItemDetailsForVisibleOrders();
      },
      error: (err) => console.error('Lỗi khi tải Orders:', err),
    });
  }
  loadFirstItemDetailsForVisibleOrders(): void {
    this.getFilteredOrders().forEach((order: any) => {
      if (order.first_item_image_url) return;

      this.accountService.getOrderDetail(order._id!).subscribe({
        next: (data) => {
          const firstItem = data.items[0];
          if (firstItem) {
            order.first_item_image_url = (firstItem.variant?.image?.[0] ||
              firstItem.product?.image?.[0] ||
              'assets/images/default-product.png') as string;
            order.first_item_name = firstItem.product?.name || 'Sản phẩm';
          }
        },
        error: (err) =>
          console.error(`Lỗi API khi tải chi tiết ĐH ${order._id!}:`, err),
      });
    });
  }

  setOrderFilter(status: string): void {
    this.orderFilter = status;
    this.selectedOrder = undefined;
    this.ordersLimit = 3;
  }

  getFilteredOrders(): Order[] {
    const filtered =
      this.orderFilter === 'ALL'
        ? this.orders
        : this.orders.filter((o) => o.status === this.orderFilter);
    return filtered.slice(0, this.ordersLimit);
  }

  getTotalFilteredOrdersCount(): number {
    return this.orderFilter === 'ALL'
      ? this.orders.length
      : this.orders.filter((o) => o.status === this.orderFilter).length;
  }

  loadMoreOrders(): void {
    this.ordersLimit += 3;
    this.loadFirstItemDetailsForVisibleOrders();
  }

  viewOrderDetail(orderId: string): void {
    this.accountService.getOrderDetail(orderId).subscribe({
      next: (data) => {
        this.selectedOrder = data.order;
        this.selectedOrderItems = data.items;

        this.selectedOrderItems.forEach((item: any) => {
          // Gán productDetail để HTML dùng
          item.productDetail = item.product;

          // Chỉ giữ variant với size, color, image
          item.variant = {
            size: item.variant?.size ?? 'N/A',
            color: item.variant?.color ?? 'N/A',
            image: item.variant?.image ?? item.product?.image ?? [],
          };

          // Bỏ variant_id
          delete item.variant_id;

          // Hiển thị ảnh + tên cho giao diện
          item.displayImage =
            item.variant.image?.[0] ??
            item.product?.image?.[0] ??
            'assets/images/default-product.png';

          item.displayName = item.product?.name ?? 'Sản phẩm';
        });
      },
      error: (err: any) => {
        console.error('Lỗi khi lấy chi tiết đơn hàng:', err);
        alert('Không thể tải chi tiết đơn hàng!');
      },
    });
  }
  requestRefund(orderId: string): void {
    alert(
      `Chức năng: Yêu cầu Trả hàng/Hoàn tiền cho đơn hàng #${orderId} đang được phát triển.`
    );
  }
  reorder(orderId: string): void {
    alert(`Chức năng: Mua lại Đơn hàng #${orderId} đang được phát triển.`);
  }

  backToOrderList(): void {
    this.selectedOrder = undefined;
  }

  getOrderStatusText(status: string): string {
    if (!status) return '';
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Chưa xác nhận';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'SHIPPING':
        return 'Đang giao hàng';
      case 'SHIPPED':
        return 'Đã giao hàng';
      case 'DELIVERED':
        return 'Đã giao thành công';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  } // VOUCHERS METHODS
  loadVouchers(): void {
    this.accountService.getVouchers().subscribe({
      next: (data) => {
        this.vouchers = data;
        this.calculateVoucherStatus();
      },
      error: (err) => console.error('Lỗi khi tải Vouchers:', err),
    });
  }

  private parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  calculateVoucherStatus(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expThreshold = new Date();
    expThreshold.setDate(today.getDate() + 7);

    this.vouchers = this.vouchers.map((v) => {
      const expiryDate = this.parseDate(v.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);

      let status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' = 'ACTIVE';
      if (expiryDate < today) status = 'EXPIRED';
      else if (expiryDate <= expThreshold) status = 'EXPIRING';

      return { ...v, status, expiryTime: expiryDate.getTime() };
    });
  }

  setVoucherFilter(status: string): void {
    this.voucherFilter = status;
    this.showAllVouchers = false;
  }

  getFilteredVouchers(): Voucher[] {
    return this.vouchers;
  }

  toggleVoucherDisplay(): void {
    this.showAllVouchers = !this.showAllVouchers;
  }
  cancelOrder(orderId: string): void {
    if (
      !confirm(
        'Bạn có chắc chắn muốn hủy đơn hàng này? Thao tác này không thể hoàn tác.'
      )
    ) {
      return;
    }

    // 1. Lấy chi tiết đơn hàng để biết các sản phẩm và số lượng cần hoàn lại
    this.accountService.getOrderDetail(orderId).subscribe({
      next: (data) => {
        const orderToCancel = data.order;
        const orderItems = data.items;

        if (orderToCancel.status.toUpperCase() !== 'PENDING') {
          alert('Đơn hàng đã được xử lý và không thể hủy.');
          this.loadOrders(); // Tải lại danh sách để cập nhật trạng thái
          return;
        }

        // 2. Gọi API để hủy đơn hàng (thay đổi trạng thái thành CANCELLED)
        this.accountService.cancelOrderApi(orderId).subscribe({
          next: () => {
            // 3. Hoàn lại số lượng tồn kho cho từng sản phẩm trong đơn
            this.revertStock(orderItems).subscribe({
              next: () => {
                alert(
                  `Đơn hàng #${orderToCancel.order_code} đã được hủy thành công và tồn kho đã được hoàn lại.`
                );

                // 4. Cập nhật giao diện
                this.loadOrders();
                this.backToOrderList();
              },
              error: (err: HttpErrorResponse) => {
                console.error('Lỗi khi hoàn lại tồn kho:', err);
                // Lưu ý: Đơn hàng đã bị hủy, chỉ có tồn kho bị lỗi
                alert(
                  `Hủy đơn hàng thành công, nhưng lỗi khi hoàn lại tồn kho: ${
                    err.error?.message || 'Lỗi không xác định'
                  }. Vui lòng liên hệ hỗ trợ.`
                );
                this.loadOrders();
                this.backToOrderList();
              },
            });
          },
          error: (err: HttpErrorResponse) => {
            console.error('Lỗi khi hủy đơn hàng:', err);
            alert(
              `Hủy đơn hàng thất bại: ${
                err.error?.message || 'Lỗi không xác định'
              }`
            );
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        console.error('Lỗi khi tải chi tiết đơn hàng để hủy:', err);
        alert('Không thể tải chi tiết đơn hàng để xử lý hủy.');
      },
    });
  }

  /**
   * Hàm hỗ trợ để gọi API hoàn lại stock cho từng item
   * @param items Danh sách các sản phẩm trong đơn hàng
   * @returns Observable hoàn thành sau khi tất cả các cập nhật stock đã được thực hiện
   */
  private revertStock(orderItems: any[]): Observable<any> {
    const stockUpdateObservables: Observable<any>[] = [];

    orderItems.forEach((item) => {
      const variantId = item.variant?._id;
      const quantityToAdd = item.quantity;

      if (variantId && quantityToAdd > 0) {
        stockUpdateObservables.push(
          this.accountService.updateProductVariantStock(
            variantId,
            quantityToAdd
          )
        );
      }
    });

    return stockUpdateObservables.length > 0
      ? forkJoin(stockUpdateObservables)
      : of(null);
  }
}
