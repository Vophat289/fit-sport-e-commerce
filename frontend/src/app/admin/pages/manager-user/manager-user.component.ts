import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // Thêm FormsModule để ngModel hoạt động
import { UserService, User } from '../../../services/manager-user.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-user-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],  // Thêm FormsModule
  templateUrl: './manager-user.component.html',
  styleUrls: ['./manager-user.component.css']
})
export class UserAdminComponent implements OnInit {

  users: User[] = [];
  filteredUsers: User[] = [];
  loading: boolean = false;

  searchTerm: string = '';
    roleFilter: string = 'all'; // 'all', 'admin', 'user'
  statusFilter: string = 'all'; // 'all', 'active', 'blocked'
  verifyFilter: string = 'all'; // 'all', 'verified', 'unverified'

  constructor(
    private userService: UserService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users = res;
        this.applyFilters(); // Áp dụng filter khi load xong
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSearchChange(value: string) {
    this.searchTerm = value;
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.users];

    // Filter theo search term
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }

    // Filter theo role
    if (this.roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === this.roleFilter);
    }

    // Filter theo status (hoạt động/bị chặn)
    if (this.statusFilter !== 'all') {
      if (this.statusFilter === 'active') {
        filtered = filtered.filter(user => !user.isBlocked);
      } else if (this.statusFilter === 'blocked') {
        filtered = filtered.filter(user => user.isBlocked);
      }
    }

    // Filter theo xác thực
    if (this.verifyFilter !== 'all') {
      if (this.verifyFilter === 'verified') {
        filtered = filtered.filter(user => user.isVerified);
      } else if (this.verifyFilter === 'unverified') {
        filtered = filtered.filter(user => !user.isVerified);
      }
    }

    this.filteredUsers = filtered;
  }

  resetFilters() {
    this.searchTerm = '';
    this.roleFilter = 'all';
    this.statusFilter = 'all';
    this.verifyFilter = 'all';
    this.applyFilters();
  }

toggleBlock(user: User) {
  if (user.isBlocked) {
    this.notification.confirm(
      `Bạn muốn mở chặn tài khoản: ${user.name}?`,
      'Xác nhận mở chặn',
      'Mở chặn',
      'Hủy'
    ).then((confirmed) => {
      if (!confirmed) return;
      this.userService.unblockUser(user._id).subscribe({
        next: () => {
          this.notification.success('Đã mở chặn tài khoản thành công!');
          user.isBlocked = false;
          this.applyFilters();
        },
        error: (err) => {
          console.error('Lỗi khi mở chặn:', err);
          this.notification.error('Lỗi khi mở chặn tài khoản.');
        }
      });
    });
  } else {
    this.notification.confirmDanger(
      `Bạn muốn CHẶN tài khoản: ${user.name}?`,
      'Xác nhận chặn tài khoản',
      'Chặn',
      'Hủy'
    ).then((confirmed) => {
      if (!confirmed) return;
      this.userService.blockUser(user._id).subscribe({
        next: () => {
          this.notification.success('Đã chặn tài khoản thành công!');
          user.isBlocked = true;
          this.applyFilters();
        },
        error: (err) => {
          console.error('Lỗi khi chặn:', err);
          this.notification.error('Lỗi khi chặn tài khoản.');
        }
      });
    });
  }
} 

  toggleRole(user: User) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';

    const msg = user.role === 'admin'
      ? `Bạn có chắc muốn hạ quyền ADMIN của "${user.name}" xuống USER không?`
      : `Bạn có chắc muốn nâng quyền "${user.name}" lên ADMIN không?`;

    const title = user.role === 'admin' ? 'Xác nhận hạ quyền' : 'Xác nhận nâng quyền';
    const confirmText = user.role === 'admin' ? 'Hạ quyền' : 'Nâng quyền';

    this.notification.confirm(
      msg,
      title,
      confirmText,
      'Hủy',
      user.role === 'admin' ? 'warning' : 'question'
    ).then((confirmed) => {
      if (!confirmed) return;

      this.userService.changeRole(user._id, newRole).subscribe({
        next: () => {
          user.role = newRole;
          this.notification.success(
            `Đã ${user.role === 'admin' ? 'nâng' : 'hạ'} quyền thành công!`
          );
          this.applyFilters();
        },
        error: (err) => {
          console.error('Lỗi khi thay đổi quyền:', err);
          this.notification.error('Lỗi khi thay đổi quyền.');
        }
      });
    });
  }
}
