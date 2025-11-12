import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  message: string | null = null;
  isError: boolean = false; // true nếu lỗi, false nếu thành công
  isLoading: boolean = false;

  private router = inject(Router);
  private authService = inject(AuthService);

  login() {
    this.message = null;

    if (!this.username || !this.password) {
      this.isError = true;
      this.message = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.';
      return;
    }

    this.isLoading = true;
    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isError = false;
        this.message = res.message || 'Đăng nhập thành công!';
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.message = err.error?.message || 'Đăng nhập thất bại, vui lòng thử lại.';
      },
    });
  }

  loginWithGoogle() {
    alert('Chức năng đăng nhập với Google chưa được triển khai.');
  }
}
