import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // Thêm FormsModule để ngModel hoạt động
import { UserService, User } from '../../../services/manager-user.service';

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

  constructor(private userService: UserService) {}

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
    if (!confirm(`Bạn muốn mở chặn tài khoản: ${user.name}?`)) return;

    this.userService.unblockUser(user._id).subscribe({
      next: () => {
        this.loadUsers(); //
      },
      error: (err) => {
        console.error('Lỗi khi mở chặn:', err);
      }
    });
  } else {
    if (!confirm(`Bạn muốn CHẶN tài khoản: ${user.name}?`)) return;

    this.userService.blockUser(user._id).subscribe({
      next: () => {
        this.loadUsers(); 
      },
      error: (err) => {
        console.error('Lỗi khi chặn:', err);
      }
    });
  }
} 

  toggleRole(user: User) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';

    const msg = user.role === 'admin'
      ? `Bạn có chắc muốn hạ quyền ADMIN của "${user.name}" xuống USER không?`
      : `Bạn có chắc muốn nâng quyền "${user.name}" lên ADMIN không?`;

    if (!confirm(msg)) return;

    this.userService.changeRole(user._id, newRole).subscribe(() => {
      user.role = newRole;
    });
  }
}
