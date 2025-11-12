import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RouterModule,Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl:'./forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  message = null as string | null;
  isError = false;
  constructor(private auth: AuthService, private router: Router) {}
  onRequest() {
    this.auth.forgotPassword(this.email).subscribe({
      next: (res: any) => { this.isError = false; this.message = res.message; setTimeout(()=> this.router.navigate(['/reset-password']),800); },
      error: (err) => { this.isError = true; this.message = err.error?.message || 'Lỗi'; }
    });
  }
}
