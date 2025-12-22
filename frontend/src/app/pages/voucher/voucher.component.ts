import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; 
import { AuthService } from '../../services/auth.service';
import { NewsService, News } from '../../services/news.service';

interface Voucher {
  code: string;
  type: string;
  value: number;
  min_order_value: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used_count: number;
  collectedBy: string[];
}

@Component({
  selector: 'app-voucher',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './voucher.component.html',
  styleUrls: ['./voucher.component.css']
})
export class VoucherComponent implements OnInit {

  vouchers: Voucher[] = [];
  filteredVouchers: Voucher[] = [];
  latestNews: News[] = [];


  loading = true;
  activeFilter: string = "all";  
  isLoggedIn = false;
  currentUser: any = null;

  currentPage = 1;
  pageSize = 3;
  hasMore = true;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private newsService: NewsService
  ) {}

  ngOnInit() {
    console.log('VoucherComponent initialized - New Version Loaded');
    this.checkLogin();
    this.fetchVouchers(1);
  }


  checkLogin() {
    const token = localStorage.getItem("token");
    this.isLoggedIn = !!token;
    if (this.isLoggedIn) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr);
        } catch (e) {
          console.error("Error parsing user from localStorage", e);
        }
      }
    }
  }

fetchVouchers(page: number = 1) {
  this.loading = true;
  this.http.get<any>(`/api/admin/vouchers?page=${page}&limit=${this.pageSize}`)
    .subscribe({
      next: (res) => {
        const newVouchersFromApi = res.vouchers || [];
        if (page === 1) {
          this.vouchers = newVouchersFromApi;
        } else {
          const uniqueNewVouchers = newVouchersFromApi.filter(
            (nv: Voucher) => !this.vouchers.some(ov => ov.code === nv.code)
          );
          this.vouchers.push(...uniqueNewVouchers);
        }

        this.applyFilter(this.activeFilter);
        this.loading = false;

        this.hasMore = this.vouchers.length < (res.total || 0);
        this.currentPage = page;
      },
      error: () => {
        this.loading = false;
        this.vouchers = [];
        this.filteredVouchers = [];
        this.hasMore = false;
      }
    });
}


  applyFilter(type: string) {
    this.activeFilter = type;
    const now = new Date().getTime();

    switch (type) {
      case "valid":
        this.filteredVouchers = this.vouchers.filter(v => new Date(v.end_date).getTime() > now);
        break;

      case "expiring":
        this.filteredVouchers = this.vouchers.filter(v => {
          const end = new Date(v.end_date).getTime();
          return end > now && end - now < 5 * 24 * 60 * 60 * 1000;
        });
        break;

      default:
        // Default: Show all (Backend already sorts by end_date desc)
        this.filteredVouchers = this.vouchers;
    }
  }

  // ... existing methods

  // Check if voucher is expired
  isExpired(v: Voucher): boolean {
    return new Date(v.end_date).getTime() < new Date().getTime();
  }

  // Check if voucher is out of stock
  isOutOfStock(v: Voucher): boolean {
    return this.getRemaining(v) <= 0;
  }

  // Get remaining quantity (Now from DB)
  getRemaining(v: Voucher): number {
    return Math.max(0, v.usage_limit - v.used_count);
  }

  // Check if user has collected this voucher (Now from DB)
  isCollected(v: Voucher): boolean {
    if (!this.isLoggedIn || !this.currentUser) return false;
    return v.collectedBy && v.collectedBy.includes(this.currentUser._id);
  }

  // Collect voucher (Now calls API)
  collectVoucher(v: Voucher) {
    if (!this.isLoggedIn) {
      alert('Vui lòng đăng nhập để thu thập voucher!');
      this.router.navigate(['/login']); 
      return;
    }

    if (this.isCollected(v)) {
      alert('Bạn đã thu thập voucher này rồi!');
      return;
    }

    if (this.isOutOfStock(v)) {
      alert('Voucher đã hết lượt sử dụng!');
      return;
    }

    const token = localStorage.getItem("token");
    this.http.post<any>('/api/voucher/collect', { code: v.code }, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        alert('Thu thập voucher thành công!');
        // Update local state
        if (!v.collectedBy) v.collectedBy = [];
        v.collectedBy.push(this.currentUser._id);
        v.used_count += 1;
      },
      error: (err) => {
        alert(err.error.message || 'Lỗi khi thu thập voucher');
      }
    });
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(code);
    alert("Đã sao chép mã: " + code);
  }

  loadMore() {
    if (!this.hasMore || this.loading) return;
    this.fetchVouchers(this.currentPage + 1);
  }

  logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      this.authService.logout().subscribe({
        next: () => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Optional: Clear collected vouchers on logout if desired, 
          // but usually these persist per user. For simple demo, we keep them or clear them.
          // localStorage.removeItem('collected_vouchers'); 

          this.isLoggedIn = false;
          this.currentUser = null;
          this.vouchers = [];
          this.filteredVouchers = [];
          this.hasMore = false;

          this.router.navigate(['/voucher']);
        }
      });
    }
  }
}
