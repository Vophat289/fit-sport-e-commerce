import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

// Interface định nghĩa cấu trúc menu item
interface MenuItem {
  label: string;  // Tên hiển thị
  icon: string;   // Class icon (Boxicons)
  route: string;  // Route path
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css']
})
export class AdminSidebarComponent implements OnInit {
  // Lưu route hiện tại để highlight menu item active
  currentRoute: string = '';

  // Danh sách menu items trong sidebar
  menuItems: MenuItem[] = [
    { label: 'Dashboards', icon: 'bx-home', route: '/admin/dashboard' },
    { label: 'Danh Mục', icon: 'bx-category', route: '/admin/category-admin' },
    { label: 'Sản Phẩm', icon: 'bx-package', route: '/admin/products' },
    { label: 'Đơn Hàng', icon: 'bx-cart', route: '/admin/orders' },
    { label: 'Tài Khoản', icon: 'bx-user', route: '/admin/users' },
    { label: 'Vouchers', icon: 'bx-gift', route: '/admin/vouchers' },
    { label: 'Bài Viết', icon: 'bx-news', route: '/admin/posts' },
    { label: 'Liên Hệ', icon: 'bx-phone', route: '/admin/contacts' }
 
  ];

  constructor(private router: Router) {}

  // Lắng nghe sự kiện route change để cập nhật currentRoute
  ngOnInit(): void {
    // Subscribe NavigationEnd event để theo dõi route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects || event.url;
      });

    // Set route ban đầu khi component load
    this.currentRoute = this.router.url;
  }

  // Kiểm tra menu item có đang active không
  isActive(route: string): boolean {
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }
}
