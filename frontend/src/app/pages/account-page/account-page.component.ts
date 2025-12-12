// src/app/pages/account-page/account-page.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';
import {
  AccountService,
  UserProfile,
  Address,
  Order,
  Voucher,
  SimpleProductDetail,
  ProductVariant,
  Review,
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
  orderCurrentPage: number = 1;
  orderPageSize: number = 3;
  orderTotalPages: number = 1;

  vouchers: Voucher[] = [];
  voucherFilter: 'ALL' | string = 'ALL';
  showAllVouchers: boolean = false;
  voucherCurrentPage: number = 1;
  voucherPageSize: number = 6;
  voucherTotalPages: number = 1;

  reviewFormVisible: { [key: string]: boolean } = {};
  productReviews: {
    [productId: string]: { rating: number | null; comment: string };
  } = {};
  userReviews: any[] = [];
  hasReviewed: { [key: string]: boolean } = {};
  stars = [1, 2, 3, 4, 5];
  hoveredStars: { [productId: string]: number } = {};

  constructor(
    private accountService: AccountService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Kiểm tra đăng nhập
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return;
    }

    // Lấy payload ban đầu
    const payload = this.accountService.getPayload();
    if (payload) {
      this.userInfo = {
        ...this.userInfo,
        name: payload.name || this.userInfo.name,
        email: payload.email || this.userInfo.email,
      };
      this.editData = { ...this.userInfo };
    }

    // Xử lý tab từ URL (chỉ 1 lần)
    const tabFromUrl = this.route.snapshot.queryParamMap.get('tab');
    if (
      tabFromUrl &&
      ['profile', 'orders', 'vouchers', 'address'].includes(tabFromUrl)
    ) {
      this.currentTab = tabFromUrl as any;
    } else {
      this.currentTab = 'profile';
    }

    // Load dữ liệu
    this.loadProfile();
    this.loadAddresses();
    this.loadOrders();
    this.loadVouchers();
    this.loadUserReviews();
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
    // Load dữ liệu nếu cần
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
  // ------------------------ ORDERS PAGINATION ------------------------
  getFilteredOrdersPaginated(): Order[] {
    const filtered =
      this.orderFilter === 'ALL'
        ? this.orders
        : this.orders.filter((o) => o.status === this.orderFilter);

    this.orderTotalPages = Math.ceil(filtered.length / this.orderPageSize);

    const startIndex = (this.orderCurrentPage - 1) * this.orderPageSize;
    const endIndex = startIndex + this.orderPageSize;

    return filtered.slice(startIndex, endIndex);
  }

  getOrderPageNumbers(): number[] {
    return Array.from({ length: this.orderTotalPages }, (_, i) => i + 1);
  }

goToOrderPage(page: number) {
  this.orderCurrentPage = page;
  this.loadFirstItemDetailsForVisibleOrders();
}


  setOrderFilter(status: string): void {
    this.orderFilter = status;
    this.selectedOrder = undefined;
    this.orderCurrentPage = 1; // reset về trang 1 khi đổi filter
  }

  loadFirstItemDetailsForVisibleOrders(): void {
    this.getFilteredOrdersPaginated().forEach((order: any) => {
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

  //Review
  // Load tất cả review của user và tạo map hasReviewed dựa trên order + product
  loadUserReviews() {
    this.accountService.getUserReviews().subscribe((res: any) => {
      this.userReviews = res.data || res;

      // Khởi tạo hasReviewed theo order + product
      this.hasReviewed = {};
      (this.userReviews || []).forEach((r: any) => {
        if (r.order && r.product) {
          this.hasReviewed[`${r.order}_${r.product}`] = true;
        }
      });
    });
  }

  // Đảm bảo object review cho productId tồn tại
  ensureReview(productId: string) {
    if (!this.productReviews[productId]) {
      this.productReviews[productId] = { rating: 0, comment: '' };
    }
  }

  // Hiển thị form review, chỉ khi sản phẩm chưa được review trong đơn hiện tại
  toggleReviewForm(productId: string) {
    if (!this.selectedOrder?._id) return;

    const reviewKey = `${this.selectedOrder._id}_${productId}`;
    this.ensureReview(productId);

    // Đảo lại logic: nếu chưa đánh giá đơn này → bật/tắt form
    this.reviewFormVisible[reviewKey] = !this.reviewFormVisible[reviewKey];
  }

  // Chọn sao
  selectStars(productId: string, rating: number) {
    this.ensureReview(productId);
    this.productReviews[productId].rating = rating;
  }

  // Hover sao
  hoverStars(productId: string, rating: number) {
    this.hoveredStars[productId] = rating;
  }

  // Leave hover
  leaveStars(productId: string) {
    this.hoveredStars[productId] = 0;
  }

  // Kiểm tra active sao cho hiển thị
  getStarActive(productId: string, PR: any, hovered: any, index: number) {
    const hover = hovered?.[productId] ?? 0;
    const rating = PR?.rating ?? 0;
    return index < (hover || rating);
  }

  // Gửi review
  submitReview(productId: string): void {
    if (!this.selectedOrder?._id) {
      alert('Không xác định được đơn hàng.');
      return;
    }

    const reviewKey = `${this.selectedOrder._id}_${productId}`;
    if (this.hasReviewed[reviewKey]) {
      alert('Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi.');
      return;
    }

    this.ensureReview(productId);
    const reviewData = this.productReviews[productId];
    const rating = Number(reviewData.rating);
    if (!rating || rating < 1) {
      alert('Vui lòng chọn số sao trước khi gửi đánh giá!');
      return;
    }

    const review: Review = {
      product_id: productId,
      order_id: this.selectedOrder._id,
      rating,
      comment: reviewData.comment?.trim() || '',
    };

    this.accountService.submitReview(review).subscribe({
      next: (res) => {
        if (res.reviewed === true) {
          alert('Bạn đã đánh giá sản phẩm này rồi.');
        } else {
          alert(res.message || 'Đánh giá đã gửi thành công!');
        }

        // Ẩn form và đánh dấu đã review cho order hiện tại
        this.reviewFormVisible[reviewKey] = false;
        this.hasReviewed[reviewKey] = true;
        // Reset form
        this.productReviews[productId] = { rating: 0, comment: '' };
      },
      error: (err: HttpErrorResponse) => {
        console.error('Lỗi khi gửi đánh giá:', err);
        alert('Gửi đánh giá thất bại.');
      },
    });
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
          if (!this.productReviews[item.productDetail._id]) {
            this.productReviews[item.productDetail._id] = {
              rating: null,
              comment: '',
            };
          }

          // Khởi tạo reviewFormVisible để form mặc định ẩn
          if (this.reviewFormVisible[item.productDetail._id] === undefined) {
            this.reviewFormVisible[item.productDetail._id] = false;
          }
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
  loadVouchers() {
    this.accountService.getVouchers().subscribe({
      next: (data) => {
        this.vouchers = data.map(
          (v: any): Voucher => ({
            code: v.code,
            discountValue: v.value ?? 0,
            minOrderValue: v.min_order_value ?? 0,
            discountType: v.type === 'percent' ? 'percentage' : 'fixed',
            expiryDate: v.end_date
              ? new Date(v.end_date).toLocaleDateString('en-GB')
              : '',
            description: v.description || '',
            status: 'ACTIVE',
          })
        );

        this.calculateVoucherStatus();
        this.calculateTotalPages();
      },
      error: (err) => console.error(err),
    });
  }
  private parseDate(dateStr?: string): Date {
    if (!dateStr) return new Date(); // fallback
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
    this.voucherCurrentPage = 1;
    this.calculateTotalPages();
  }

  getFilteredVouchers(): Voucher[] {
    // 1. Lọc theo trạng thái trước
    const filtered =
      this.voucherFilter === 'ALL'
        ? this.vouchers
        : this.vouchers.filter((v) => v.status === this.voucherFilter);
    this.calculateTotalPages(filtered.length);

    const startIndex = (this.voucherCurrentPage - 1) * this.voucherPageSize;
    const endIndex = startIndex + this.voucherPageSize;

    return filtered.slice(startIndex, endIndex);
  }
  getVoucherPageNumbers(): number[] {
    return Array.from({ length: this.voucherTotalPages }, (_, i) => i + 1);
  }

  toggleVoucherDisplay(): void {
    this.showAllVouchers = !this.showAllVouchers;
  }
  /**
   * @param totalItems
   */
  calculateTotalPages(totalItems: number = this.vouchers.length): void {
    this.voucherTotalPages = Math.ceil(totalItems / this.voucherPageSize);
    if (
      this.voucherPageSize > this.voucherTotalPages &&
      this.voucherTotalPages > 0
    ) {
      this.voucherPageSize = this.voucherTotalPages;
    }
    if (this.voucherTotalPages === 0) {
      this.voucherPageSize = 1;
    }
  }
  /**
    @param page
   */
  goToVoucherPage(page: number): void {
    if (page >= 1 && page <= this.voucherTotalPages) {
      this.voucherCurrentPage = page;
    }
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
