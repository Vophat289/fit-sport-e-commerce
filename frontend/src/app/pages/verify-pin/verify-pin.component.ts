import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-verify-pin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './verify-pin.component.html',
  styleUrls: ['./verify-pin.component.css']
})
export class VerifyPinComponent {
  pin: string = "";
  message: string = "";
  isError: boolean = false;
  email: string ="";

  constructor(private authService: AuthService, private router: Router) {
   this.email = localStorage.getItem('verificationEmail') || '';
        
        if (!this.email) {
            this.router.navigate(['/register']);
        }
    }

onVerifyPin() {
  if (!this.pin || this.pin.length !== 6) {
    this.isError = true;
    this.message = "Mã PIN phải gồm 6 số!";
    return;
  }

 this.authService.verifyPin(this.email, this.pin.trim()).subscribe({
    next: (res: any) => {
      this.isError = false;
      this.message = "Xác thực thành công! Bạn có thể đăng nhập.";
      
      setTimeout(() => {
          this.router.navigate(['/login']);
      }, 1000); 
      
    },
    error: (err: any) => {
      this.isError = true;
      this.message = err.error?.message || "Mã PIN không chính xác!";
    }
  });
}
}
