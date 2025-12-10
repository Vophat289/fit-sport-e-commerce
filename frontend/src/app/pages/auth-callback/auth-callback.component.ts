import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <div style="text-align: center;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 48px; color: #007bff;"></i>
        <p style="margin-top: 20px; font-size: 18px;">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  ngOnInit() {
    // Lấy token từ session thông qua API
    this.authService.getSessionData().subscribe({
      next: (response) => {
        // Lưu tokens vào localStorage
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        this.authService.updateCurrentUser(response.user);
        this.toastr.success('Đăng nhập Google thành công!');

        // Điều hướng dựa trên role
        if (response.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.toastr.error('Lỗi xử lý đăng nhập Google');
        console.error('Session data error:', err);
        this.router.navigate(['/login']);
      }
    });
  }
}
