import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { ToastrService } from 'ngx-toastr';
import { Product, ProductService } from '@app/services/product.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  userName: string | null = null;
  searchQuery: string = ''; //lưu từ khóa tìm
  searchResults: Product[] = []; // lưu kết quả search
  showResults: boolean = false; // hiển thị kq search
  loading: boolean = false;
  cartCount: number = 0;

  private userSub: Subscription = new Subscription();
  private cartSub: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe((user) => {
      this.userName = user?.displayName || user?.name || null;
    });

    // số lượng sản phẩm trong giỏ
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
          // this.cartService.clearCart();
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.router.navigate(['/home']);
        },
        error: () => Swal.fire('Lỗi', 'Đăng xuất thất bại', 'error'),
      });
    }
  });
}
  //search
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value.trim();

    //ktra nếu rỗng thì reset
    if (!this.searchQuery) {
      this.searchResults = [];
      this.showResults = false;
      return;
    }

    this.performSearch(this.searchQuery);
  }

  performSearch(query: string): void {
    //ktra độ dài kí tự
    if (query.length < 2) {
      return;
    }

    this.loading = true;
    this.showResults = true;

    this.productService.searchProducts(query).subscribe({
      next: (data) => {
        this.searchResults = data.products;
        this.loading = false;
      },
      error: (err) => {
        this.searchResults = [];
        this.loading = false;
        this.showResults = false;
      },
    });
  }

  onSearchSubmit(): void {
    //ktra có từ khóa k
    if (!this.searchQuery.trim()) {
      return; //dừng lại
    }

    //navigate đến trang product
    this.router.navigate(['/products'], {
      queryParams: { search: this.searchQuery },
    });

    this.showResults = false;
  }

  goToProduct(slug: string): void {
    this.router.navigate(['/products', slug]);

    this.showResults = false;
    this.searchQuery = '';
    this.searchResults = [];
  }

  hideResults(): void {
    setTimeout(() => {
      this.showResults = false;
    }, 200); //delay 200ms
  }
}
