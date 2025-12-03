import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProductService, Product} from '@app/services/product.service';
import { CategoryService , Category} from '@app/services/category.service';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CartService, AddCartPayload } from '@app/services/cart.service';

@Component({
  selector: 'app-product-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-page.component.html',
  styleUrls: ['./product-page.component.css'],
})
export class ProductPageComponent implements OnInit {
  loading: boolean = true;
  categories: Category[] = [];
  selectedCategory: string | null = null;
  isModalOpen: boolean = false;
  selectedProduct: Product | null = null;
  allProducts: Product[] = []; // Danh sách gốc của sp kh bao giờ thay đổi
  filteredProducts: Product[] = []; // Danh sách thay đổi khi lọc

  // 1. Dùng cho bộ lọc (filter) - Mảng string (Không thay đổi tên)
  availableSizes: string[] = []; 

  filters = { // lưu trạng thái filter
    category: null as string | null,
    sizes: [] as string[],
    priceRange: {
      min: 20000,
      max: 5000000
    }
  }
  
  // 2. Dùng cho Modal Biến Thể (Đã đổi tên để tránh xung đột)
  availableVariantSizes: { id: string; name: string }[] = []; 
  availableColors: { id: string; name: string; hex: string }[] = [];
  isVariantsLoading: boolean = false;

  selectedSizeName: string | null = null;
  selectedColorName: string | null = null;
  quantityToAdd: number = 1;

  currentVariantDetails: any | null = null;
  private pendingCategorySlug: string | null = null; // dùng cho route

  // ĐÃ SỬA LỖI: Gộp tất cả services vào một constructor duy nhất
  constructor(
    private productService: ProductService,
    private categoryService: CategoryService, 
    private route: ActivatedRoute,
    private cartService: CartService, 
    private router: Router
  ) {}


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
        this.filteredProducts = data; 
        this.extractUniqueSizes(data); // Tạo availableSizes (string[]) cho bộ lọc

        // Cập nhật slider range ban đầu
        setTimeout(() => {
          this.updateSliderRange(this.filters.priceRange.min, this.filters.priceRange.max);
        }, 100);

        this.loading = false;
        this.handleRouteCategory();
      },
      error: (err: any) => {
        console.error('Lỗi tải sản phẩm: ', err);
        this.loading = false;
      },
    });
  }
  extractUniqueSizes(products: Product[]): void{
    const sizeSet = new Set<string>(); 
    products.forEach(product => {
      if(product.sizes && product.sizes.length > 0){
        product.sizes.forEach(size => sizeSet.add(size));
      }
    });
    this.availableSizes = Array.from(sizeSet).sort(); // Mảng string[] dùng cho lọc sidebar
  }

  applyFilters(): void {
    let result = [...this.allProducts];

    //lọc theo danh mục
    if(this.filters.category){
      result = result.filter(product => {
        const categorySlug = typeof product.category === 'object' && product.category !== null 
        ? (product.category as Category).slug: null;
        return categorySlug === this.filters.category;
      });
    }

    //lọc theo size
    if(this.filters.sizes.length > 0){
      result = result.filter(product => {
        if(!product.sizes || product.sizes.length === 0){
          return false; 
        };
        return this.filters.sizes.some(selectedSize => 
          product.sizes!.includes(selectedSize)
        );
      });
    }

    //lọc theo giá
    result = result.filter(product => {
      return product.price >= this.filters.priceRange.min &&
             product.price <= this.filters.priceRange.max;
    });

    this.filteredProducts = result;
  }

  //nghe sự kiện khi category thay đổi ngoài trang chủ sẽ lọc sp theo danh mục
  private listenToRouteCategory(): void{
    this.route.queryParamMap.subscribe(params => {
      this.pendingCategorySlug = params.get('category');
      this.handleRouteCategory();
    })
  }

  handleRouteCategory(): void{
    if(!this.allProducts.length){
      return; 
    }

    if(this.pendingCategorySlug){
      // Đảm bảo gọi filterByCategory sử dụng logic applyFilters()
      this.filterByCategory(this.pendingCategorySlug);
    }else {
      this.resetFilter()
    }
  }

  // Lọc sp theo danh mục (Giữ lại phiên bản dùng applyFilters)
  filterByCategory(slug: string | null): void {
    this.filters.category = slug;
    this.selectedCategory = slug; // Giữ lại cho hiển thị active trên thanh menu
    this.applyFilters(); 
  }

  //checkbox size
  toggleSize(size: string): void{
    const index = this.filters.sizes.indexOf(size);
    if(index > -1){
      this.filters.sizes.splice(index, 1);
    }else{
      this.filters.sizes.push(size);
    }
    this.applyFilters();
  }

  //giá min max
  updatePriceRange(min: number, max: number): void {
    this.filters.priceRange.min = min;
    this.filters.priceRange.max = max;
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
    
    const sliderContainer = document.querySelector('.slider-container') as HTMLElement;
    if (sliderContainer) {
      sliderContainer.style.setProperty('--slider-min-percent', minPercent + '%');
      sliderContainer.style.setProperty('--slider-max-percent', maxPercent + '%');
    }
  }

  //reset tất cả filter 
  resetFilters(): void{
    this.filters = {
      category: null,
      sizes: [],
      priceRange: {
        min: 20000,
        max: 5000000
      }
    };
    this.selectedCategory = null; // Cần reset cái này nếu nó dùng cho hiển thị active
    setTimeout(() => {
      this.updateSliderRange(this.filters.priceRange.min, this.filters.priceRange.max);
    }, 100);
    this.filteredProducts = [...this.allProducts];
  }
  
  //lấy danh mục
  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data: Category[]) => {
        this.categories = data;
      },
      error: (err: any) => console.error('Lỗi tải danh mục', err),
    });
  }
  // LOẠI BỎ ĐỊNH NGHĨA filterByCategory THỨ 2 VÌ NÓ TRÙNG VÀ DÙNG LOGIC CŨ

  resetFilter(): void {
    this.selectedCategory = null; // Đã reset trong resetFilters() ở trên
    this.resetFilters();
  }

  // Modal & Cart
  openVariantModal(product: Product): void {
    this.selectedProduct = product;
    this.isModalOpen = true;
    this.isVariantsLoading = true;
    this.quantityToAdd = 1;

    this.selectedSizeName = null;
    this.selectedColorName = null;
    this.currentVariantDetails = null;

    this.productService.getAvailableVariants(product._id!).subscribe({
      next: (data: any) => {
        this.availableVariantSizes = data.availableSizes; 
        this.availableColors = data.availableColors;

        this.selectedSizeName =
          data.availableSizes.length > 0 ? data.availableSizes[0].name : null;
        this.selectedColorName =
          data.availableColors.length > 0 ? data.availableColors[0].name : null;

        this.isVariantsLoading = false;
        this.updateVariantDetails();
      },
      error: (err: any) => {
        console.error('Không tải được biến thể khả dụng:', err);
        alert(
          err.error?.message || 'Sản phẩm này hiện hết hàng hoặc có lỗi xảy ra.'
        );
        this.isVariantsLoading = false;
        this.closeModal();
      },
    });
  }
  closeModal(): void {
    this.isModalOpen = false;
    this.selectedProduct = null;
  }

  decrementQuantity(): void {
    if (this.quantityToAdd > 1) this.quantityToAdd--;
  }

  incrementQuantity(): void {
    const maxQuantity = this.currentVariantDetails?.quantity || 99;
    if (this.quantityToAdd < maxQuantity) {
      this.quantityToAdd++;
    } else {
      alert(`Chỉ còn ${maxQuantity} sản phẩm trong kho.`);
    }
  }
  updateVariantDetails(): void {
    const size = this.availableVariantSizes.find( 
      (s) => s.name === this.selectedSizeName
    );
    const color = this.availableColors.find(
      (c) => c.name === this.selectedColorName
    );

    this.currentVariantDetails = null;
    this.quantityToAdd = 1;

    if (size && color && this.selectedProduct?._id) {
      const sizeId = size.id;
      const colorId = color.id;
      const productId = this.selectedProduct._id;

      this.productService
        .getVariantDetails(productId, sizeId, colorId)
        .subscribe({
          next: (variantData: any) => {
            const quantity = variantData.quantity || 0;
            this.currentVariantDetails = { price: variantData.price, quantity };
            if (this.quantityToAdd > quantity)
              this.quantityToAdd = quantity > 0 ? 1 : 0;
            if (quantity === 0)
              alert('Tổ hợp Kích cỡ/Màu sắc này hiện đã hết hàng.');
          },
          error: (err: any) => {
            this.currentVariantDetails = {
              price: this.selectedProduct?.price || 0,
              quantity: 0,
            };
            this.quantityToAdd = 0;
            alert(
              err.error?.message || 'Tổ hợp này không tồn tại hoặc hết hàng.'
            );
          },
        });
    } else {
      this.currentVariantDetails = null;
      this.quantityToAdd = 0;
    }
  }

  onQuantityChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let value = parseInt(inputElement.value, 10);
    const maxQuantity = this.currentVariantDetails?.quantity || 99;

    if (isNaN(value) || value < 1) value = 1;
    else if (value > maxQuantity) {
      value = maxQuantity > 0 ? maxQuantity : 1;
      alert(`Chỉ còn ${maxQuantity} sản phẩm trong kho.`);
    }

    this.quantityToAdd = value;
    inputElement.value = value.toString();
  }

confirmAddToCart(): void {
  if (
    !this.selectedProduct ||
    !this.selectedSizeName ||
    !this.selectedColorName ||
    this.quantityToAdd < 1
  ) {
    alert('Vui lòng chọn Kích cỡ, Màu sắc và Số lượng hợp lệ.');
    return;
  }

    const actualSize = this.availableVariantSizes.find(
    (s) => s.name === this.selectedSizeName
  );
  const actualColor = this.availableColors.find(
    (c) => c.name === this.selectedColorName
  );

  if (!actualSize || !actualColor) {
    alert('Lỗi ánh xạ: Vui lòng tải lại trang.');
    return;
  }

  const imageString = Array.isArray(this.selectedProduct.image)
    ? this.selectedProduct.image[0]
    : this.selectedProduct.image || 'assets/images/placeholder-shirt.png';

  const payload: AddCartPayload = {
    productId: this.selectedProduct._id as string,
    name: this.selectedProduct.name,
    price: this.currentVariantDetails.price,
    image: imageString,
    sizeId: actualSize.id,
    sizeName: actualSize.name,
    colorId: actualColor.id,
    colorName: actualColor.name,
    quantity: this.quantityToAdd,
  };

  // Lấy giỏ hàng hiện tại từ CartService
  this.cartService.getCartDetails().subscribe((cartData) => {
    const existingItem = cartData.items.find(
      (i) =>
        i.variant_id === payload.productId &&
        i.sizeId === payload.sizeId &&
        i.colorId === payload.colorId
    );

    const maxStock = this.currentVariantDetails?.quantity || 0;
    const totalDesiredQuantity =
      (existingItem?.quantity || 0) + this.quantityToAdd;

    if (totalDesiredQuantity > maxStock) {
      const canAdd = maxStock - (existingItem?.quantity || 0);
      if (canAdd <= 0) {
        alert(`Đã hết tồn kho cho sản phẩm này.`);
        return;
      }

      // hỏi người dùng có muốn thêm số lượng tối đa còn lại
      const confirmAdd = confirm(
        `Số lượng yêu cầu vượt quá tồn kho. Bạn có muốn thêm ${canAdd} sản phẩm còn lại không?`
      );
      if (!confirmAdd) return;

      payload.quantity = canAdd; // tự động giới hạn số lượng còn lại
    }

    // Thêm vào giỏ
    this.cartService.addToCart(payload).subscribe({
      next: () => {
        alert(`Đã thêm ${payload.quantity} ${this.selectedProduct?.name} vào giỏ hàng!`);
        this.closeModal();
      },
      error: (err) => {
        console.error('Thêm vào giỏ hàng thất bại:', err);
        alert('Thêm vào giỏ hàng thất bại.');
      },
    });
  });
}
}