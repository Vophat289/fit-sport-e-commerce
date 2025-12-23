import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { FavoriteService } from '../../services/favorite.service';
import { Product, ProductService } from '@app/services/product.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  userName: string | null = null;

  searchQuery = '';
  searchResults: Product[] = [];
  showResults = false;
  loading = false;

  cartCount = 0;
  favoriteCount = 0;

  private userSub = new Subscription();
  private cartSub = new Subscription();
  private favoriteSub = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private favoriteService: FavoriteService
  ) {}

  ngOnInit() {
    // USER
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.userName = user?.displayName || user?.name || null;
    });

    // CART COUNT
    this.cartSub = this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    // FAVORITE COUNT
    this.favoriteSub = this.favoriteService.favorites$.subscribe(products => {
      this.favoriteCount = products.length;
    });
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.cartSub.unsubscribe();
    this.favoriteSub.unsubscribe();
  }

  // NAVIGATION
  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }

  goToFavorites() {
    this.router.navigate(['/favorite']);
  }

  logout() {
    Swal.fire({
      title: 'Đăng xuất?',
      text: 'Bạn có chắc chắn muốn đăng xuất không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy',
    }).then(result => {
      if (result.isConfirmed) {
        this.authService.logout().subscribe({
          next: () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.router.navigate(['/home']);
          },
          error: () => Swal.fire('Lỗi', 'Đăng xuất thất bại', 'error'),
        });
      }
    });
  }

  // SEARCH
  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim();
    this.searchQuery = value;

    if (!value) {
      this.searchResults = [];
      this.showResults = false;
      return;
    }

    this.performSearch(value);
  }

  performSearch(query: string) {
    if (query.length < 2) return;

    this.loading = true;
    this.showResults = true;

    this.productService.searchProducts(query).subscribe({
      next: res => {
        this.searchResults = res.products;
        this.loading = false;
      },
      error: () => {
        this.searchResults = [];
        this.loading = false;
        this.showResults = false;
      },
    });
  }

  onSearchSubmit() {
    if (!this.searchQuery.trim()) return;

    this.router.navigate(['/products'], {
      queryParams: { search: this.searchQuery },
    });

    this.showResults = false;
  }

  goToProduct(slug: string) {
    this.router.navigate(['/products', slug]);
    this.showResults = false;
    this.searchQuery = '';
    this.searchResults = [];
  }

  hideResults() {
    setTimeout(() => (this.showResults = false), 200);
  }

  // Promo link → trang ưu đãi
  goToVoucherPage() {
    this.router.navigate(['/voucher']);
  }
}
