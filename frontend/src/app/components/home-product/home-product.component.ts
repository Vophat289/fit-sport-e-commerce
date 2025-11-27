import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '@app/services/product.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-product',
  imports: [CommonModule],
  templateUrl: './home-product.component.html',
  styleUrl: './home-product.component.css'
})
export class HomeProductComponent implements OnInit{
  products: Product[] = [];
  loading = true; //loading chờ sp

  //khởi tạo service
  constructor(
    private productService: ProductService,
    private router: Router
  ){}

  ngOnInit(): void {
    this.loadProducts(); // hàm load sản phẩm
  }

  //load sp từ api
  loadProducts(): void {
    //gọi service để lấy danh sách sp
    this.productService.getAll().subscribe({
      //next xử lí khi thành cong
      next: (data) => {
        this.products = [...data].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
        this.loading = false;
        console.log('Sản phẩm đã tải: ', data);
      },
      error:(err) => {
        console.error('Lỗi tải sản phẩm: ', err);
        this.loading = false;

      }
    });
  }

  viewProductDetail(product: Product): void{
    this.router.navigate(['/products', product.slug]);
  }

  //UI Tĩnh test 
  addToCart(product: any) {
  console.log('🛒 Đã thêm vào giỏ:', product.name);
  
  } 
}
