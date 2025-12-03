import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ProductService, Product } from '@app/services/product.service';
import { CategoryService, Category } from '@app/services/category.service';
import { FormsModule } from '@angular/forms';
import { CartService, AddCartPayload } from '@app/services/cart.service';

interface VariantSize {
  id: string;
  name: string;
}

interface VariantColor {
  id: string;
  name: string;
  hex?: string;
}

interface VariantDetails {
  price: number;
  quantity: number;
  variantId: string;
}

@Component({
  selector: 'app-product-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.css',
})
export class ProductPageComponent implements OnInit {
  products: Product[] = [];
  loading: boolean = true;
  categories: Category[] = [];
  selectedCategory: string | null = null; //lưu lại danh mục khi chọn sp

  allProducts: Product[] = []; // Danh sách gốc của sp kh bao giờ thay đổi
  filteredProducts: Product[] = []; // dnah sách thay đổi khi lọc
  availableSizes: string[] = [];

  // Modal variables
  isModalOpen: boolean = false;
  selectedProduct: Product | null = null;
  availableVariantSizes: VariantSize[] = [];
  availableColors: VariantColor[] = [];
  selectedSizeName: string | null = null;
  selectedColorName: string | null = null;
  currentVariantDetails: VariantDetails | null = null;
  quantityToAdd: number = 1;
  isLoadingVariants: boolean = false;
  variantErrorMessage: string | null = null;

  filters = {
    //lưu trạng thái filter
    category: null as string | null,
    sizes: [] as string[],
    priceRange: {
      min: 20000,
      max: 5000000,
    },
  };

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService
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
      //subscribe nó nhận dữ liệu khi api hoàn thành
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
      },
    });
  }

  extractUniqueSizes(products: Product[]): void {
    const sizeSet = new Set<string>(); //tự động loại bỏ giá trị trùng lặp

    //forEach để duyệt qua từng sp trong mảng
    products.forEach((product) => {
      //kiểm tra xem sp có size k
      if (product.sizes && product.sizes.length > 0) {
        product.sizes.forEach((size) => sizeSet.add(size)); // thêm từng size vào set (loại bỏ duplicate)
      }
    });
    this.availableSizes = Array.from(sizeSet).sort(); // chuyển set thành array và dùng sort để sắp xếp
  }

  applyFilters(): void {
    //dùng spread operator [...] tạo bản sao của allProducts
    let result = [...this.allProducts];

    //lọc theo danh mục
    if (this.filters.category) {
      result = result.filter((product) => {
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
      result = result.filter((product) => {
        //kiểm tra size của sp
        if (!product.sizes || product.sizes.length === 0) {
          return false; //ko có size thì loại
        }

        // kiểm tra lọc theo size
        return this.filters.sizes.some(
          (selectedSize) => product.sizes!.includes(selectedSize)
          // .some kiem tra có ít nhất 1 phần tử trong mảng để thõa điều kiện
          // .includes kiem tra phần tử có trong mảng k
        );
      });
    }

    //lọc theo giá
    result = result.filter((product) => {
      //kiểm tra giá nằm trong min max
      return (
        product.price >= this.filters.priceRange.min &&
        product.price <= this.filters.priceRange.max
      );
    });

    //cập nhật ds hien thi
    this.filteredProducts = result;
  }

  //danh mục đang chờ lọc
  private pendingCategorySlug: string | null = null;

  //nghe sự kiện khi category thay đổi ngoài trang chủ sẽ lọc sp theo danh mục
  private listenToRouteCategory(): void {
    this.route.queryParamMap.subscribe((params) => {
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
    const sliderContainer = document.querySelector(
      '.slider-container'
    ) as HTMLElement;
    if (sliderContainer) {
      sliderContainer.style.setProperty(
        '--slider-min-percent',
        minPercent + '%'
      );
      sliderContainer.style.setProperty(
        '--slider-max-percent',
        maxPercent + '%'
      );
    }
  }


  //reset tất cả filter
  resetFilters(): void {
    this.filters = {
      category: null,
      sizes: [],
      priceRange: {
        min: 20000,
        max: 5000000,
      },
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

  incrementQuantity(): void {
    const maxQuantity = this.currentVariantDetails?.quantity || 99;
    if (this.quantityToAdd < maxQuantity) {
      this.quantityToAdd++;
    } else {
      alert(`Chỉ còn ${maxQuantity} sản phẩm trong kho.`);
    }
  }
  updateVariantDetails(): void {
    if (!this.selectedProduct?._id || !this.selectedSizeName || !this.selectedColorName) {
      this.currentVariantDetails = null;
      return;
    }

    const size = this.availableVariantSizes.find((s) => s.name === this.selectedSizeName);
    const color = this.availableColors.find((c) => c.name === this.selectedColorName);

    if (!size || !color) {
      this.currentVariantDetails = null;
      return;
    }

    // Gọi API để lấy chi tiết variant (price, quantity)
    this.productService
      .getVariantDetails(this.selectedProduct._id, size.id, color.id)
      .subscribe({
        next: (data: any) => {
          this.currentVariantDetails = {
            price: data.price,
            quantity: data.quantity,
            variantId: data.variantId,
          };
          // Reset quantity nếu vượt quá tồn kho
          if (this.quantityToAdd > data.quantity) {
            this.quantityToAdd = Math.max(1, data.quantity);
          }
        },
        error: (err) => {
          console.error('Lỗi tải chi tiết variant:', err);
          this.currentVariantDetails = null;
        },
      });
  }

  //lấy danh mục
  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => console.error('Lỗi tải danh mục', err),
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


  // Mở modal chọn variant
  openVariantModal(product: Product): void {
    this.selectedProduct = product;
    this.isModalOpen = true;
    this.selectedSizeName = null;
    this.selectedColorName = null;
    this.currentVariantDetails = null;
    this.quantityToAdd = 1;
    this.isLoadingVariants = true;
    this.variantErrorMessage = null;
    this.availableVariantSizes = [];
    this.availableColors = [];

    // Load variants cho product này
    if (product._id) {
      this.productService.getAvailableVariants(product._id).subscribe({
        next: (data: any) => {
          this.isLoadingVariants = false;
          this.availableVariantSizes = data.availableSizes || [];
          this.availableColors = data.availableColors || [];
          
          // Kiểm tra nếu không có variants
          if ((!data.availableSizes || data.availableSizes.length === 0) && 
              (!data.availableColors || data.availableColors.length === 0)) {
            this.variantErrorMessage = data.message || 'Sản phẩm này hiện chưa có biến thể hoặc đã hết hàng.';
          }
        },
        error: (err) => {
          this.isLoadingVariants = false;
          console.error('Lỗi tải variants:', err);
          
          // Nếu là 404, có nghĩa là không có variants
          if (err.status === 404) {
            this.variantErrorMessage = 'Sản phẩm này hiện chưa có biến thể hoặc đã hết hàng.';
          } else {
            this.variantErrorMessage = 'Không thể tải thông tin biến thể sản phẩm. Vui lòng thử lại sau.';
          }
        },
      });
    } else {
      this.isLoadingVariants = false;
      this.variantErrorMessage = 'Không tìm thấy thông tin sản phẩm.';
    }
  }

  // Đóng modal
  closeModal(): void {
    this.isModalOpen = false;
    this.selectedProduct = null;
    this.availableVariantSizes = [];
    this.availableColors = [];
    this.selectedSizeName = null;
    this.selectedColorName = null;
    this.currentVariantDetails = null;
    this.quantityToAdd = 1;
    this.isLoadingVariants = false;
    this.variantErrorMessage = null;
  }

  // Giảm số lượng
  decrementQuantity(): void {
    if (this.quantityToAdd > 1) {
      this.quantityToAdd--;
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
      !this.currentVariantDetails ||
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
          alert(
            `Đã thêm ${payload.quantity} ${this.selectedProduct?.name} vào giỏ hàng!`
          );
          this.closeModal();
        },
        error: (err) => {
          console.error('Thêm vào giỏ hàng thất bại:', err);
          alert('Thêm vào giỏ hàng thất bại.');
        },
      });
    });
  }}
