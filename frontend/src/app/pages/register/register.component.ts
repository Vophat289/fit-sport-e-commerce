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
    this.isLoading = true;
        this.auth.register(this.name, this.email, this.password).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                this.isError = false;
                this.message = res.message || 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã PIN.';
                localStorage.setItem('verificationEmail', this.email); 
              
                setTimeout(() => this.router.navigate(['/verify-pin']), 800);
            },
            error: (err) => {
                this.isLoading = false;
                this.isError = true;
                this.message = err.error?.message || 'Lỗi đăng ký.';
      }
    });
  }
}
