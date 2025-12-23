import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '@app/services/product.service';
import { CategoryService, Category } from '@app/services/category.service';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '@app/services/cart.service';
import { FavoriteService } from '@app/services/favorite.service';
import {
  ProductModalComponent,
  VariantSelection,
} from '@app/components/product-modal/product-modal.component';

@Component({
  selector: 'app-product-page',
  imports: [CommonModule, FormsModule, RouterLink, ProductModalComponent],
  templateUrl: './product-page.component.html',
  styleUrls: ['./product-page.component.css'],
})
export class ProductPageComponent implements OnInit {
  loading: boolean = true;
  categories: Category[] = [];
  selectedCategory: string | null = null;
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];

  // Dùng cho bộ lọc (filter)
  availableSizes: string[] = [];

  filters = {
    category: null as string | null,
    sizes: [] as string[],
    priceRange: {
      min: 20000,
      max: 5000000,
    },
  };

  // Dùng cho modal
  isModalOpen: boolean = false;
  selectedProduct: Product | null = null;

  private pendingCategorySlug: string | null = null;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private cartService: CartService,
    private favoriteService: FavoriteService, // ❤️ Thêm Favorite Service
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // ==================== YÊU THÍCH - SỬ DỤNG FAVORITE SERVICE ====================
  toggleFavorite(product: Product, event?: Event): void {
    event?.stopPropagation();
    this.favoriteService.toggleFavorite(product).subscribe({
      next: () => {
        console.log(`Toggle yêu thích thành công: ${product.name}`);
        this.cdr.detectChanges(); // cập nhật giao diện ngay
      },
      error: (err) => console.error('Toggle yêu thích thất bại', err)
    });
  }

  isFavorite(product: Product): boolean {
    return this.favoriteService.isFavorite(product._id);
  }
  // ============================================================

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
        this.extractUniqueSizes(data);

        setTimeout(() => {
          this.updateSliderRange(
            this.filters.priceRange.min,
            this.filters.priceRange.max
          );
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

  extractUniqueSizes(products: Product[]): void {
    const sizeSet = new Set<string>();
    products.forEach((product) => {
      if (product.sizes && product.sizes.length > 0) {
        product.sizes.forEach((size) => sizeSet.add(size));
      }
    });
    this.availableSizes = Array.from(sizeSet).sort();
  }

  applyFilters(): void {
    let result = [...this.allProducts];

    if (this.filters.category) {
      result = result.filter((product) => {
        const categorySlug =
          typeof product.category === 'object' && product.category !== null
            ? (product.category as Category).slug
            : null;
        return categorySlug === this.filters.category;
      });
    }

    if (this.filters.sizes.length > 0) {
      result = result.filter((product) => {
        if (!product.sizes || product.sizes.length === 0) {
          return false;
        }
        return this.filters.sizes.some((selectedSize) =>
          product.sizes!.includes(selectedSize)
        );
      });
    }

    result = result.filter((product) => {
      const productPrice = product.displayPrice || product.price;
      return (
        productPrice >= this.filters.priceRange.min &&
        productPrice <= this.filters.priceRange.max
      );
    });

    this.filteredProducts = result;
  }

  private listenToRouteCategory(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.pendingCategorySlug = params.get('category');
      this.handleRouteCategory();
    });
  }

  handleRouteCategory(): void {
    if (!this.allProducts.length) return;

    if (this.pendingCategorySlug) {
      this.filterByCategory(this.pendingCategorySlug);
    } else {
      this.resetFilters();
    }
  }

  filterByCategory(slug: string | null): void {
    this.filters.category = slug;
    this.selectedCategory = slug;
    this.applyFilters();
  }

  toggleSize(size: string): void {
    const index = this.filters.sizes.indexOf(size);
    if (index > -1) {
      this.filters.sizes.splice(index, 1);
    } else {
      this.filters.sizes.push(size);
    }
    this.applyFilters();
  }

  updatePriceRange(min: number, max: number): void {
    this.filters.priceRange.min = min;
    this.filters.priceRange.max = max;
    this.updateSliderRange(min, max);
    this.applyFilters();
  }

  updateSliderRange(min: number, max: number): void {
    const minValue = 20000;
    const maxValue = 5000000;
    const range = maxValue - minValue;

    const minPercent = ((min - minValue) / range) * 100;
    const maxPercent = ((max - minValue) / range) * 100;

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

  resetFilters(): void {
    this.filters = {
      category: null,
      sizes: [],
      priceRange: { min: 20000, max: 5000000 },
    };
    this.selectedCategory = null;
    setTimeout(() => {
      this.updateSliderRange(this.filters.priceRange.min, this.filters.priceRange.max);
    }, 100);
    this.filteredProducts = [...this.allProducts];
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe({
      next: (data: Category[]) => (this.categories = data),
      error: (err: any) => console.error('Lỗi tải danh mục', err),
    });
  }

  openVariantModal(product: Product): void {
    this.selectedProduct = product;
    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedProduct = null;
    this.cdr.detectChanges();
  }

  handleAddToCart(payload: VariantSelection): void {
    const imageString = Array.isArray(this.selectedProduct!.image)
      ? this.selectedProduct!.image[0]
      : this.selectedProduct!.image || 'assets/images/placeholder-shirt.png';

    const cartPayload = {
      productId: this.selectedProduct!._id as string,
      name: this.selectedProduct!.name,
      price: payload.price,
      image: imageString,
      sizeId: payload.sizeId,
      sizeName: payload.sizeName,
      colorId: payload.colorId,
      colorName: payload.colorName,
      quantityToAdd: payload.quantity,
      stock: payload.stock,
    };

    this.cartService.getCartDetails().subscribe((cartData) => {
      const existingItem = cartData.items.find(
        (i) =>
          i.variant_id === cartPayload.productId &&
          i.sizeId === cartPayload.sizeId &&
          i.colorId === cartPayload.colorId
      );

      const maxStock = payload.stock || 0;
      const totalDesiredQuantity =
        (existingItem?.quantityToAdd || 0) + cartPayload.quantityToAdd;

      if (totalDesiredQuantity > maxStock) {
        const canAdd = maxStock - (existingItem?.quantityToAdd || 0);
        if (canAdd <= 0) {
          alert(`Đã hết tồn kho cho sản phẩm này.`);
          return;
        }

        const confirmAdd = confirm(
          `Số lượng yêu cầu vượt quá tồn kho. Bạn có muốn thêm ${canAdd} sản phẩm còn lại không?`
        );
        if (!confirmAdd) return;

        cartPayload.quantityToAdd = canAdd;
      }

      this.cartService.addToCart(cartPayload).subscribe({
        next: () => {
          alert(
            `Đã thêm ${cartPayload.quantityToAdd} ${this.selectedProduct!.name} vào giỏ hàng!`
          );
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
