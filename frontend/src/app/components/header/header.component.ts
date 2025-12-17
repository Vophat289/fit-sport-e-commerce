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
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  userName: string | null = null;
  searchQuery: string = '';
  searchResults: Product[] = [];
  showResults = false;
  loading = false;
  cartCount = 0;
  favoriteCount = 0;

  private userSub: Subscription = new Subscription();
  private cartSub: Subscription = new Subscription();
  private favoriteSub: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private favoriteService: FavoriteService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    // Lấy thông tin user
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.userName = user?.displayName || user?.name || null;
    });

    // Lấy số lượng sản phẩm trong giỏ
    this.cartSub = this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    // Lấy số lượng sản phẩm yêu thích
    this.favoriteSub = this.favoriteService.favorites$.subscribe((products: Product[]) => {
      this.favoriteCount = products.length;
    });
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
    this.cartSub.unsubscribe();
    this.favoriteSub.unsubscribe();
  }

  // --- Navigation ---
  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }

  goToFavorites() {
    this.router.navigate(['/favorite']); // ← đã fix, đúng route
  }

  logout() {
    Swal.fire({
      title: 'Đăng xuất?',
      text: 'Bạn có chắc chắn muốn đăng xuất không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy'
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

  // --- Search ---
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value.trim();
    if (!this.searchQuery) {
      this.searchResults = [];
      this.showResults = false;
      return;
    }
    this.performSearch(this.searchQuery);
  }

  performSearch(query: string): void {
    if (query.length < 2) return;
    this.loading = true;
    this.showResults = true;
    this.productService.searchProducts(query).subscribe({
      next: data => {
        this.searchResults = data.products;
        this.loading = false;
      },
      error: () => {
        this.searchResults = [];
        this.loading = false;
        this.showResults = false;
      }
    });
  }

  onSearchSubmit(): void {
    if (!this.searchQuery.trim()) return;
    this.router.navigate(['/products'], { queryParams: { search: this.searchQuery } });
    this.showResults = false;
  }

  goToProduct(slug: string): void {
    this.router.navigate(['/products', slug]);
    this.showResults = false;
    this.searchQuery = '';
    this.searchResults = [];
  }

  hideResults(): void {
    setTimeout(() => { this.showResults = false; }, 200);
  }
}
