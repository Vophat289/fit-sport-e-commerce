import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '@app/services/product.service';
import { CategoryService, Category } from '@app/services/category.service';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.css'
})
export class ProductPageComponent implements OnInit {

  products: Product[] = [];
  loading: boolean = true;
  categories: Category[] = [];
  selectedCategory: string | null = null; //lưu lại danh mục khi chọn sp

  allProducts: Product[] = []; // Danh sách gốc của sp kh bao giờ thay đổi
  filteredProducts: Product[] = []; // dnah sách thay đổi khi lọc
  availableSizes: string[] = [];

  filters = { //lưu trạng thái filter
    category: null as string | null,
    sizes: [] as string[],
    priceRange: {
      min: 20000,
      max: 5000000
    }
  }

  private pendingCategorySlug: string | null = null;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute
  ) {}

  //lifecycle hook
  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.listenToRouteCategory();
  }

  loadProducts(): void {
    this.loading = true;

    this.productService.getAll().subscribe({
      next: (data) => {
        this.allProducts = data;
        this.filteredProducts = data; //lưu vào filteredproducts (ban đầu = tất cả)
        this.extractUniqueSizes(data); // extract unique để hiển thị checkbox

        // Cập nhật slider range ban đầu
        setTimeout(() => {
          this.updateSliderRange(
            this.filters.priceRange.min,
            this.filters.priceRange.max
          );
        }, 100);

        this.loading = false;
        console.log('Sản phẩm đã tải: ', data);

        this.handleRouteCategory();
      },
      error: (err) => {
        console.log('Lỗi tải sản phẩm: ', err);
        this.loading = false;
      }
    });
  }

  extractUniqueSizes(products: Product[]): void {
    const sizeSet = new Set<string>(); //tự động loại bỏ giá trị trùng lặp

    //forEach để duyệt qua từng sp trong mảng
    products.forEach(product => {

      //kiểm tra xem sp có size k 
      if (product.sizes && product.sizes.length > 0) {
        product.sizes.forEach(size => sizeSet.add(size)); // thêm từng size vào set (loại bỏ duplicate)
      }
    });

    this.availableSizes = Array.from(sizeSet).sort(); // chuyển set thành array và dùng sort để sắp xếp
  }

  applyFilters(): void {
    //dùng spread operator [...] tạo bản sao của allProducts
    let result = [...this.allProducts];

    //lọc theo danh mục
    if (this.filters.category) {
      result = result.filter(product => {

        //kiểm tra category của sản phẩm
        const categorySlug =
          typeof product.category === 'object' && product.category !== null
            ? (product.category as Category).slug
            : null;

        //so sánh slug với filter
        return categorySlug === this.filters.category;
      });
    }

    //lọc theo size
    if (this.filters.sizes.length > 0) {
      result = result.filter(product => {

        //kiểm tra size của sp
        if (!product.sizes || product.sizes.length === 0) {
          return false; //ko có size thì loại 
        }

        // kiểm tra lọc theo size
        return this.filters.sizes.some(selectedSize =>
          product.sizes!.includes(selectedSize)
        );
      });
    }

    //lọc theo giá
    result = result.filter(product => {
      //kiểm tra giá nằm trong min max
      return (
        product.price >= this.filters.priceRange.min &&
        product.price <= this.filters.priceRange.max
      );
    });

    //cập nhật ds hien thi 
    this.filteredProducts = result;
  }

  //nghe sự kiện khi category thay đổi ngoài trang chủ sẽ lọc sp theo danh mục
  private listenToRouteCategory(): void {
    this.route.queryParamMap.subscribe(params => {
      this.pendingCategorySlug = params.get('category');
      this.handleRouteCategory();
    });
  }

  handleRouteCategory(): void {
    if (!this.allProducts.length) {
      return; //chưa có du lieu de lọc
    }

    if (this.pendingCategorySlug) {
      this.filterByCategory(this.pendingCategorySlug);
    } else {
      this.resetFilter();
    }
  }

  //lọc sp theo danh mục
  filterByCategory(slug: string | null): void {
    //cập nhật filter
    this.filters.category = slug;
    this.selectedCategory = slug;

    this.applyFilters(); //áp dụng filter
  }

  //checkbox size
  toggleSize(size: string): void {
    const index = this.filters.sizes.indexOf(size);

    if (index > -1) {
      this.filters.sizes.splice(index, 1);
    } else {
      this.filters.sizes.push(size);
    }

    //áp dụng cho filter liền
    this.applyFilters();
  }

  //giá min max
  updatePriceRange(min: number, max: number): void {
    this.filters.priceRange.min = min;
    this.filters.priceRange.max = max;

    // Cập nhật CSS variable để hiển thị phần được chọn
    this.updateSliderRange(min, max);

    this.applyFilters();
  }

  // Cập nhật phần được chọn trên slider
  updateSliderRange(min: number, max: number): void {
    const minValue = 20000;
    const maxValue = 5000000;
    const range = maxValue - minValue;

    const minPercent = ((min - minValue) / range) * 100;
    const maxPercent = ((max - minValue) / range) * 100;

    // Cập nhật CSS variable
    const sliderContainer = document.querySelector('.slider-container') as HTMLElement;

    if (sliderContainer) {
      sliderContainer.style.setProperty('--slider-min-percent', minPercent + '%');
      sliderContainer.style.setProperty('--slider-max-percent', maxPercent + '%');
    }
  }

  //reset tất cả filter
  resetFilters(): void {
    this.filters = {
      category: null,
      sizes: [],
      priceRange: {
        min: 20000,
        max: 5000000
      }
    };

    // Cập nhật slider range
    setTimeout(() => {
      this.updateSliderRange(
        this.filters.priceRange.min,
        this.filters.priceRange.max
      );
    }, 100);

    //hiển thị lại sp
    this.filteredProducts = [...this.allProducts];
  }

  //lấy danh mục
  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => { this.categories = data },
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
