import { Component, OnInit } from '@angular/core';
import { Router, RouterModule  } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Product, ProductService } from '@app/services/product.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  userName: string | null = null;
  searchQuery: string = ''; //lưu từ khóa tìm
  searchResults: Product[] = []; // lưu kết quả search
  showResults: boolean = false;// hiển thị kq search
  loading: boolean =  false ;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private toastr: ToastrService,
    private productService: ProductService
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

  //search
  onSearchInput(event: Event): void{
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value.trim();

    //ktra nếu rỗng thì reset 
    if(!this.searchQuery){
      this.searchResults = [];
      this.showResults = false;
      return;
    }
    
    this.performSearch(this.searchQuery);
  }

  performSearch(query: string): void{
    //ktra độ dài kí tự
    if(query.length < 2){
      return;
    }

    this.loading = true;reactjs
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
      }
    });
  }

  onSearchSubmit(): void{
    //ktra có từ khóa k
    if(!this.searchQuery.trim()){
      return; //dừng lại
    }

    //navigate đến trang product 
    this.router.navigate(['/products'], {
      queryParams: { search: this.searchQuery}
    });
    
    this.showResults = false;
  }

  goToProduct(slug: string): void{
    this.router.navigate(['/products', slug]);

    this.showResults = false;
    this.searchQuery = '';
    this.searchResults = [];
  }

  hideResults(): void{
    setTimeout(() => {
      this.showResults = false;
    }, 200); //delay 200ms
  }
}
