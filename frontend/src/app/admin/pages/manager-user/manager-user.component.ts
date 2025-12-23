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
        this.filteredUsers = res; // Khởi tạo dữ liệu filtered
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSearchChange(value: string) {
    this.filteredUsers = this.users.filter(user =>
      user.name.toLowerCase().includes(value.toLowerCase()) ||
      user.email.toLowerCase().includes(value.toLowerCase())
    );
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
          this.loadUsers();
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
          this.loadUsers();
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
        },
        error: (err) => {
          console.error('Lỗi khi thay đổi quyền:', err);
          this.notification.error('Lỗi khi thay đổi quyền.');
        }
      });
    });
  }
}
