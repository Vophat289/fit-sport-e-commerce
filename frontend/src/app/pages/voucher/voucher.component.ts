import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  templateUrl: './voucher.component.html',
  styleUrls: ['./voucher.component.css']
})
export class VoucherComponent implements OnInit {

  vouchers: Voucher[] = [];
  filteredVouchers: Voucher[] = [];

  loading = true;
  activeFilter: string = "all";  
  isLoggedIn = false;   // kiểm tra người dùng đăng nhập

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.checkLogin();
    this.fetchVouchers();
  }

  checkLogin() {
    const token = localStorage.getItem("token");
    this.isLoggedIn = !!token;
  }

  fetchVouchers() {
    this.http.get<any>("http://localhost:3000/api/vouchers")
      .subscribe({
        next: (res) => {
          this.vouchers = res.vouchers || [];
          this.applyFilter("all");
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.vouchers = [];
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
          return end > now && end - now < 5 * 24 * 60 * 60 * 1000; // 5 ngày
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

  logout() {
  localStorage.removeItem("token");
  window.location.reload();
}

}
