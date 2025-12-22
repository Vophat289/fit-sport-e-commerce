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
  }

fetchVouchers(page: number = 1) {
  this.loading = true;
  this.http.get<any>(`/api/admin/vouchers?page=${page}&limit=${this.pageSize}`)
    .subscribe({
      next: (res) => {
        if (page === 1) {
          this.vouchers = res.vouchers || [];
        } else {
          this.vouchers.push(...(res.vouchers || []));
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

  // Get remaining quantity (simulated)
  getRemaining(v: Voucher): number {
    // Note: In a real app, 'used_count' comes from backend. 
    // Here we simulate local decrement if user collected it, 
    // but we should not double count if backend already updated used_count.
    // For this demo, we assume backend data + local collection.
    const collected = this.isCollected(v.code) ? 1 : 0;
    return Math.max(0, v.usage_limit - v.used_count - collected);
  }

  // Check if user has collected this voucher
  isCollected(code: string): boolean {
    if (!this.isLoggedIn) return false;
    const collected = JSON.parse(localStorage.getItem('collected_vouchers') || '[]');
    return collected.includes(code);
  }

  // Collect voucher
  collectVoucher(v: Voucher) {
    if (!this.isLoggedIn) {
      alert('Vui lòng đăng nhập để thu thập voucher!');
      this.router.navigate(['/login']); 
      return;
    }

    if (this.isCollected(v.code)) {
      alert('Bạn đã thu thập voucher này rồi!');
      return;
    }

    if (this.isOutOfStock(v)) {
      alert('Voucher đã hết lượt sử dụng!');
      return;
    }

    const collected = JSON.parse(localStorage.getItem('collected_vouchers') || '[]');
    collected.push(v.code);
    localStorage.setItem('collected_vouchers', JSON.stringify(collected));
    
    alert('Thu thập voucher thành công!');
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
          this.vouchers = [];
          this.filteredVouchers = [];
          this.hasMore = false;

          this.router.navigate(['/voucher']);
        }
      });
    }
  }
}
