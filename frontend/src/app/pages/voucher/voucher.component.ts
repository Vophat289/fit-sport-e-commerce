import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { News } from '../../services/news.service';
import { NewsService } from '../../services/news.service';

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
  pageSize = 5;
  hasMore = true;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private newsService: NewsService
  ) {}

  ngOnInit() {
    this.checkLogin();
    this.loadLatestNews()
    if(this.isLoggedIn) {
      this.fetchVouchers(1);
    }
  }

loadLatestNews() {
  this.newsService.getLatestNews().subscribe({
    next: (res) => {
      this.latestNews = Array.isArray(res) ? res.slice(0, 5) : [];
    },
    error: (err) => console.error("Lỗi load bài viết mới:", err)
  });
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
          if(page === 1) {
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

      case "expired":
        this.filteredVouchers = this.vouchers.filter(v => new Date(v.end_date).getTime() < now);
        break;

      default:
        this.filteredVouchers = this.vouchers;
    }
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
