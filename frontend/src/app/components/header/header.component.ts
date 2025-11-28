import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  userName: string | null = null;
  cartCount: number = 0;

  private userSub: Subscription = new Subscription();
  private cartSub: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe((user) => {
      this.userName = user?.displayName || user?.name || null;
    });

    // ✅ Lắng nghe số lượng sản phẩm trong giỏ
    this.cartSub = this.cartService.cartCount$.subscribe((count) => {
      this.cartCount = count;
    });
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.cartSub.unsubscribe();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }

  logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      this.authService.logout().subscribe({
        next: () => {
          this.cartService.clearCart(); // ✅ reset số lượng
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.router.navigate(['/home']);
        },
        error: () => alert('Đăng xuất thất bại. Vui lòng thử lại.'),
      });
    }
  }
}
