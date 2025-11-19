import { Component, OnInit } from '@angular/core';
import { Router, RouterModule  } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule, RouterModule ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  userName: string | null = null;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private toastr: ToastrService
) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      console.log('User object:', user);
      if (user) {
        this.userName = typeof user.displayName === 'string' ? user.displayName : (user.name || 'Người dùng');
      } else {
        this.userName = null;
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
 logout() {
  if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) { 
    this.authService.logout().subscribe({
        next: () => {
            alert('Đăng xuất thành công'); 

            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            this.router.navigate(['/home']);
        },
        error: (err) => {
            alert('Đăng xuất thất bại. Vui lòng thử lại.');
        }
    });
  }
}
}
