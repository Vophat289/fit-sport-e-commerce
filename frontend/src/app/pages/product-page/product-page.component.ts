import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProductService, Product} from '@app/services/product.service';
import {  CategoryService , Category} from '@app/services/category.service'

@Component({
  selector: 'app-product-page',
  imports: [CommonModule],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.css'
})
export class ProductPageComponent implements OnInit{

  products: Product[] = [];
  loading: boolean = true;
  categories: Category[] = [];
  selectedCategory: string | null = null; //lưu lại danh mục khi chọn sp

  constructor(private productService: ProductService, private categoryService: CategoryService) {}

  //lifecycle hook
  ngOnInit(): void { 
    this.loadProducts();
    this.loadCategories();
  }
  
  loadProducts(): void {
    this.loading = true;
    this.productService.getAll().subscribe({ //subscribe nó nhận dữ liệu khi api hoàn thành 
      next: (data) => {
        this.products = data;
        this.loading = false;
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
    this.categoryService.getAll().subscribe({
      next: (data) => { this.categories = data},
      error: (err) => console.error('Lỗi tải danh mục', err)
    });
  }

  //lọc sp theo danh mục
  filterByCategory(slug: string): void {
    this.loading = true;
    this.selectedCategory = slug;
    this.productService.getByCategory(slug).subscribe({
      next: (data) => { 
        this.products = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Không lọc được sản phẩm ', err);
        this.loading = false;
      }
    });
  }

  //xem lại all sp
  resetFilter(): void {
    this.selectedCategory = null;
    this.loadProducts();
  }

  //test add cart
   addToCart(product: Product): void {
    console.log('🛒 Đã thêm vào giỏ:', product.name);
  }
}
