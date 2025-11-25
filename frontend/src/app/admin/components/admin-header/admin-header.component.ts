import { Component, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.css']  
})
export class AdminHeaderComponent {
  // Thông tin user hiển thị trong header
  userName: string = 'Admin';
  userRole: string = 'Quản trị viên';

  // State cho dropdowns
  showNotifications: boolean = false;
  showUserMenu: boolean = false;
  isDarkMode: boolean = true;

  // Notifications data
  notificationCount: number = 3;
  notifications = [
    { id: 1, title: 'Đơn hàng mới #12345', time: '5 phút trước', read: false },
    { id: 2, title: 'Sản phẩm hết hàng: Áo thun', time: '1 giờ trước', read: false },
    { id: 3, title: 'Có tin nhắn mới từ khách hàng', time: 'Hôm qua', read: true }
  ];

  constructor(private el: ElementRef) {}

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
    this.isDarkMode = !this.isDarkMode;
    // Logic để thay đổi theme sẽ được implement sau
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
    // Logic logout sẽ được implement sau
    console.log('Logout');
  }
}
