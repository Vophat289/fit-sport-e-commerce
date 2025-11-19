import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProductService, Product} from '@app/services/product.service';
import {  CategoryService , Category} from '@app/services/category.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.css'
})
export class ProductPageComponent implements OnInit{

  products: Product[] = [];
  loading: boolean = true;
  categories: Category[] = [];
  selectedCategory: string | null = null; //lưu lại danh mục khi chọn sp

  allProducts: Product[] = [];// Danh sách gốc của sp kh bao giờ thay đổi
  filteredProducts: Product[] = [];// dnah sách thay đổi khi lọc
  availableSizes: string[] = [];

  filters = { //lưu trạng thái filter
    category: null as string | null,
    sizes: [] as string[],
    priceRange: {
      min: 30000,
      max: 2000000
    }
  }
  
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

        this.allProducts = data;
        this.filteredProducts = data; //lưu vào filteredproducts (ban đầu = tất cả)
        this.extractUniqueSizes(data);// extract unique để hiển thị checkbox
        this.resetFilter();

        this.loading = false;
        console.log('Sản phẩm đã tải: ', data);
      },
      error: (err) => {
        console.log('Lỗi tải sản phẩm: ', err);
        this.loading = false;
      }
    });
  }

  extractUniqueSizes(products: Product[]): void{
    const sizeSet = new Set<string>(); //tự động loại bỏ giá trị trùng lặp

    //forEach để duyệt qua từng sp trong mảng
    products.forEach(product => {

      //kiểm tra xem sp có size k 
      if(product.sizes && product.sizes.length > 0){
        product.sizes.forEach(size => sizeSet.add(size)); // thêm từng size vào set (loại bỏ duplicate)
      }
    });
    this.availableSizes = Array.from(sizeSet).sort(); // chuyển set thành array và dùng sort để sắp xếp 
  }

  applyFilters(): void {
    //dùng spread operator [...] tạo bản sao của allProducts
    let result = [...this.allProducts];

    //lọc theo danh mục
    if(this.filters.category){
      result = result.filter(product => {
        //kiểm tra category của sản phẩm
        const categorySlug = typeof product.category === 'object' && product.category !== null 
        ? (product.category as Category).slug: null;

        //so sánh slug với filter
        return categorySlug === this.filters.category;
      });
    }

    //lọc theo size
    if(this.filters.sizes.length > 0){
      result = result.filter(product => {
        //kiểm tra size của sp
        if(!product.sizes || product.sizes.length === 0){
          return false; //ko có size thì loại 
        };
      
        // kiểm tra lọc theo size
        return this.filters.sizes.some(selectedSize => 
          product.sizes!.includes(selectedSize)
          // .some kiem tra có ít nhất 1 phần tử trong mảng để thõa điều kiện
          // .includes kiem tra phần tử có trong mảng k
        );
      });
    }

    //lọc theo giá
    result = result.filter(product => {
      //kiểm tra giá nằm trong min max
      return product.price >= this.filters.priceRange.min &&
             product.price <= this.filters.priceRange.max;
    });

    //cập nhật ds hien thi 
    this.filteredProducts = result;
  }

  //lọc sp theo danh mục
  filterByCategory(slug: string | null): void {
    //cập nhật filter
    this.filters.category = slug;
    this.selectedCategory = slug;
    
    this.applyFilters(); //áp dụng filter
  }

  //checkbox size
  toggleSize(size: string): void{
    const index = this.filters.sizes.indexOf(size);

    if(index > -1){
      this.filters.sizes.splice(index, 1);
    }else{
      this.filters.sizes.push(size);
    }

    //áp dụng cho filter liền
    this.applyFilters();
  }

  //giá min max
  updatePriceRange(min: number, max: number): void {
    this.filters.priceRange.min = min;
    this.filters.priceRange.max = max;

    this.applyFilters();
  }

  //reset tất cả filter 
  resetFilters(): void{
    this.filters = {
      category: null,
      sizes: [],
      priceRange: {
        min: 20000,
        max: 2000000
      }
    };
    //hiển thị lại sp
    this.filteredProducts = [...this.allProducts];
  }
  
  //lấy danh mục
  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => { this.categories = data},
      error: (err) => console.error('Lỗi tải danh mục', err)
    });
  }

  //xem lại all sp
  resetFilter(): void {
    this.selectedCategory = null;
    this.resetFilters();
  }

  //test add cart
   addToCart(product: Product): void {
    console.log('🛒 Đã thêm vào giỏ:', product.name);
  }
}
