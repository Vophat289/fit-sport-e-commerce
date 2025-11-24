// src/app/pages/account-page/account-page.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router, RouterModule } from '@angular/router'; 
import { AccountService, UserProfile, Address, Order, Voucher } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.css']
})
export class AccountPageComponent implements OnInit {
  // TAB & EDIT MODE
  currentTab: 'profile' | 'orders' | 'vouchers' | 'address' = 'profile';
  isEditing: boolean = false;

  // PROFILE
  userInfo: UserProfile = { name: 'Loading...', email: '', phone: '', gender: '', dob: '' }; 
  editData: UserProfile = { name: '', email: '', phone: '', gender: '', dob: '' };
  userAvatarUrl: string = 'assets/images/default-avatar.png';

  // ADDRESS
  addresses: Address[] = [];
  selectedAddressId: string | null = null;
  isAddressModalOpen: boolean = false;
  editingAddress?: Address;

  // ORDERS
  orders: Order[] = [];
  selectedOrder?: Order;
  ordersLimit: number = 3;
  orderFilter: 'ALL' | string = 'ALL';

  // VOUCHERS
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
    }

    // 2. Lấy payload ban đầu
    const payload = this.accountService.getPayload();
    if (payload) {
      this.userInfo = { ...this.userInfo, ...payload };
      this.editData = { ...this.userInfo };
    }

    // 3. Tải dữ liệu ban đầu
    this.loadProfile();
    // Tải địa chỉ, đơn hàng, voucher ngay từ đầu
    this.loadAddresses(); 
    this.loadOrders();
    this.loadVouchers();
  }

  // =========================
  // PROFILE METHODS
  // =========================
  loadProfile(): void {
    this.accountService.getProfile().subscribe({
      next: (data) => {
        this.userInfo = { ...this.userInfo, ...data };
        this.editData = { ...this.userInfo };
        // this.userAvatarUrl = data.avatarUrl || this.userAvatarUrl;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Lỗi khi tải Profile:', err);
        if (err.status === 401) {
          localStorage.removeItem('token');
          alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          this.router.navigate(['/home']);
        }
      }
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
      }
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
  }
  // ADDRESS METHODS
  loadAddresses(): void {
    this.accountService.getAddresses().subscribe({
      next: (data) => {
        this.addresses = data;
        const defaultAddress = data.find(a => a.isDefault);
        this.selectedAddressId = defaultAddress?._id ?? data[0]?._id ?? null;
      },
      error: (err) => console.error('Lỗi khi tải Addresses:', err)
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
        isDefault: false
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
        const errorMessage = err.error?.message || 'Lưu địa chỉ thất bại. Vui lòng thử lại.';
        alert(errorMessage);
      }
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
        const errorMessage = err.error?.message || 'Xóa địa chỉ thất bại. Vui lòng thử lại.';
        alert(errorMessage);
      }
    });
  }
  // ORDERS METHODS
  loadOrders(): void {
    this.accountService.getOrders().subscribe({
      next: (data) => { this.orders = data; },
      error: (err) => console.error('Lỗi khi tải Orders:', err)
    });
  }

  setOrderFilter(status: string): void {
    this.orderFilter = status;
    this.selectedOrder = undefined;
    this.ordersLimit = 3;
  }

  getFilteredOrders(): Order[] {
    const filtered = this.orderFilter === 'ALL'
      ? this.orders
      : this.orders.filter(o => o.status === this.orderFilter);
    return filtered.slice(0, this.ordersLimit);
  }

  getTotalFilteredOrdersCount(): number {
    return this.orderFilter === 'ALL'
      ? this.orders.length
      : this.orders.filter(o => o.status === this.orderFilter).length;
  }

  loadMoreOrders(): void {
    this.ordersLimit += 3;
  }

  viewOrderDetail(orderId: string): void {
    this.selectedOrder = this.orders.find(o => o._id === orderId);
  }

  backToOrderList(): void {
    this.selectedOrder = undefined;
  }

  getOrderStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Đang xử lý';
      case 'SHIPPED': return 'Đang vận chuyển';
      case 'DELIVERED': return 'Đã giao';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  }
  // VOUCHERS METHODS
  loadVouchers(): void {
    this.accountService.getVouchers().subscribe({
      next: (data) => {
        this.vouchers = data;
        this.calculateVoucherStatus();
      },
      error: (err) => console.error('Lỗi khi tải Vouchers:', err)
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

    this.vouchers = this.vouchers.map(v => {
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
}