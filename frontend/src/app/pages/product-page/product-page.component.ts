import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProductService, Product} from '@app/services/product.service';

@Component({
  selector: 'app-product-page',
  imports: [CommonModule],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.css'
})
export class ProductPageComponent implements OnInit{

  products: Product[] = [];
  loading: boolean = true;
  categories: any[] = [];
  selectdCategory: string | null = null;

  constructor(private productService: ProductService) {}

  ngOnInit(): void { 
    this.loadProducts();
    this.loadCategories();
  }
  
  loadProducts(): void {
    this.loading = true;
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = data;
        this.categories = false;
        console.log('Sản phẩm đã tải: ', data);
      },
      error: (err) => {
        console.log('Lỗi tải sản phẩm: ', err);
        this.loading = false;
      }
    });
  }

  //lấy danh mục
  loadCategories(): void {
    this.productService.getProductsByCategory().subscribe({
      next: (data) => (this.categories = data),
      error: (err) => console.error('Lỗi tải danh mục', err)
      
    });
  }
}
