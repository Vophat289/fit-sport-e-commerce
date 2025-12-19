import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  message: string | null = null;
  isError: boolean = false;
  isLoading: boolean = false;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  ngOnInit() {
    // OAuth callback giờ được xử lý bởi AuthCallbackComponent
    // Component này chỉ xử lý đăng nhập thông thường
  }

  login() {
    this.message = null;

    if (!this.email || !this.password) {
      this.isError = true;
      this.message = 'Vui lòng nhập đầy đủ email và mật khẩu.';
      return;
    }

    const email = this.email.trim().toLowerCase();

    console.log('Gửi dữ liệu đăng nhập:', { email, password: this.password });

    this.isLoading = true;
    this.authService.login(email, this.password).subscribe({
      next: (res) => {
        this.toastr.success('Đăng nhập thành công');
        this.isLoading = false;
        const redirect = localStorage.getItem('afterLoginRedirect');

      if (redirect) {
        localStorage.removeItem('afterLoginRedirect');
        this.router.navigate([redirect]);
      } else {
        this.router.navigate(['/home']);
      }
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 403 && err.error?.message.includes('chặn')) {
        this.message = 'Tài khoản của bạn đã bị chặn. Vui lòng liên hệ quản trị viên.';
      } else {
        this.message = err.error?.message || 'Đăng nhập thất bại, vui lòng thử lại.';
      }
      this.toastr.error(this.message ?? 'Lỗi');
      },
    });
  }

  loginWithGoogle() {
    window.location.href = '/api/auth/google';
  }
}
