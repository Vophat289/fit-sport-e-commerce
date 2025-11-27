import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
export class LoginComponent  {
  identifier: string = '';
  password: string = '';
  message: string | null = null;
  isError: boolean = false;
  isLoading: boolean = false;

  private router = inject(Router);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);


  ngOnInit() {
    const params = new URLSearchParams(window.location.search);
    const user = params.get('user');
    const token = params.get('token');

    if (user && token) {
      const parsedUser = JSON.parse(user);
      localStorage.setItem('user', JSON.stringify(parsedUser));
      localStorage.setItem('token', token);
      this.authService['currentUserSubject'].next(parsedUser);
      this.router.navigate(['/home']);
    }
  }

  login() {
    this.message = null;

    if (!this.identifier || !this.password) {
      this.isError = true;
      this.message = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.';
      return;
    }

    this.isLoading = true;
    this.authService.login(this.identifier, this.password).subscribe({
      next: (res) => {
        localStorage.setItem('user', JSON.stringify(res.user));
        localStorage.setItem('token', res.token);
        this.authService['currentUserSubject'].next(res.user);
        this.toastr.success('Đăng nhập thành công');
        this.isLoading = false;

        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.message = err.error?.message || 'Đăng nhập thất bại, vui lòng thử lại.';
        this.toastr.error(this.message ?? 'Lỗi');
      },
    });
  }
  loginWithGoogle() {
    window.location.href = 'http://localhost:3000/api/auth/google';
  }
}
