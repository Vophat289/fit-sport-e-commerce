import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  message: string | null = null;
  isError = false;
  isLoading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onRegister() {
    this.message = null;
    if (!this.name || !this.email || !this.password || !this.confirmPassword) {
      this.isError = true;
      this.message = 'Vui lòng điền đầy đủ thông tin.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.isError = true;
      this.message = 'Mật khẩu xác nhận không khớp.';
      return;
    }

    this.isLoading = true;
    this.auth.register(this.name, this.email, this.password).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.isError = false;
        this.message = res.message || 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã PIN.';
        setTimeout(() => this.router.navigate(['/verify']), 1200);
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.message = err.error?.message || 'Lỗi đăng ký.';
      }
    });
  }
}
