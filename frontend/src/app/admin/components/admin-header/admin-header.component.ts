import { Component, HostListener, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AdminThemeService, AdminThemeMode } from '../../services/theme.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.css']  
})
export class AdminHeaderComponent implements OnInit, OnDestroy {
  // Thông tin user hiển thị trong header
  userName: string = 'Admin';
  userRole: string = 'Quản trị viên';
  userInitial: string = 'A';

  // State cho dropdowns
  showNotifications: boolean = false;
  showUserMenu: boolean = false;

  // Notifications data
  notificationCount: number = 3;
  notifications = [
    { id: 1, title: 'Đơn hàng mới #12345', time: '5 phút trước', read: false },
    { id: 2, title: 'Sản phẩm hết hàng: Áo thun', time: '1 giờ trước', read: false },
    { id: 3, title: 'Có tin nhắn mới từ khách hàng', time: 'Hôm qua', read: true }
  ];

  private userSubscription?: Subscription;

  constructor(
    private el: ElementRef, 
    private themeService: AdminThemeService,
    private authService: AuthService,
    private router: Router,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    // Lấy thông tin user từ AuthService
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = user.name || 'Admin';
        this.userRole = user.role === 'admin' ? 'Quản trị viên' : 'Người dùng';
        // Lấy chữ cái đầu của tên để hiển thị trong avatar
        this.userInitial = this.userName.charAt(0).toUpperCase();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  // Getter để lấy currentTheme$ observable
  get currentTheme$(): Observable<AdminThemeMode> {
    return this.themeService.currentTheme$;
  }

  // Toggle notifications dropdown
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  // Toggle user menu dropdown
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  // Toggle dark/light mode
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  // Đóng dropdowns khi click bên ngoài
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showNotifications = false;
      this.showUserMenu = false;
    }
  }

  // Đánh dấu tất cả notifications đã đọc
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.notificationCount = 0;
  }

  // Xóa notification
  removeNotification(id: number): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notificationCount = this.notifications.filter(n => !n.read).length;
  }

  // Logout
  logout(): void {
    this.notification.confirm(
      'Bạn có chắc chắn muốn đăng xuất không?',
      'Xác nhận đăng xuất',
      'Đăng xuất',
      'Hủy'
    ).then((confirmed) => {
      if (!confirmed) return;

      this.authService.logout().subscribe({
        next: () => {
          this.notification.success('Đăng xuất thành công!');
          this.router.navigate(['/']);
        },
        error: () => {
          this.notification.error('Đăng xuất thất bại');
        }
      });
    });
  }
}
