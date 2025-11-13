import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent {
  email = '';
  pin = '';
  newPassword = '';
  message: string | null = null;
  isError = false;
  constructor(private auth: AuthService, private router: Router) {}
onReset() {
  this.auth.resetPassword(this.pin, this.newPassword).subscribe({
    next: (res:any) => {
      this.isError = false;
      this.message = res.message;
      setTimeout(() => this.router.navigate(['/login']), 1000);
    },
    error: (err) => {
      this.isError = true;
      this.message = err.error?.message || 'Lỗi';
    }
  });
}
}
