import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ProductService, Product } from '@app/services/product.service';
import { CartService } from '@app/services/cart.service';
import { FavoriteService } from '@app/services/favorite.service';
import { NotificationService } from '@app/services/notification.service';

import {
  ProductModalComponent,
  VariantSelection,
} from '@app/components/product-modal/product-modal.component';

@Component({
  selector: 'app-home-best-selling-product',
  imports: [CommonModule, ProductModalComponent],
  templateUrl: './home-best-selling-product.component.html',
  styleUrl: './home-best-selling-product.component.css',
})
export class HomeBestSellingProductComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  loading = true;
  isModalOpen: boolean = false;
  selectedProduct: Product | null = null;

  // ===== FAVORITE =====
  favoriteIds: Set<string> = new Set();

  // ===== IMAGE SLIDE =====
  currentImageIndex: { [productId: string]: number } = {};
  imageSlideIntervals: { [productId: string]: any } = {};

  // ===== CAROUSEL =====
  productsStartIndex: number = 0;
  productsPerView: number = 5; // Hiển thị 5 sản phẩm mỗi lần

  constructor(
    private productService: ProductService,
    private router: Router,
    private cartService: CartService,
    private favoriteService: FavoriteService,
    private cdr: ChangeDetectorRef,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadProducts();

    // Subscribe để update favorite UI realtime
    this.favoriteService.favorites$.subscribe((products) => {
      this.favoriteIds = new Set(products.map((p) => p._id));
      this.cdr.detectChanges(); // cập nhật UI
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getBestSellingProducts(12).subscribe({
      next: (data) => {
        this.products = data || [];
        this.productsStartIndex = 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi tải sản phẩm bán chạy: ', err);
        this.products = [];
        this.loading = false;
      },
    });
  }

  // ===== CAROUSEL METHODS =====
  getVisibleProducts(): Product[] {
    const endIndex = this.productsStartIndex + this.productsPerView;
    const visible = this.products.slice(this.productsStartIndex, endIndex);
    
    // Nếu chưa đủ số lượng, lấy thêm từ đầu (vòng lặp)
    if (visible.length < this.productsPerView && this.products.length > 0) {
      const remaining = this.productsPerView - visible.length;
      const fromStart = this.products.slice(0, remaining);
      return [...visible, ...fromStart];
    }
    
    return visible;
  }

  canScrollPrev(): boolean {
    return this.products.length > this.productsPerView;
  }

  canScrollNext(): boolean {
    return this.products.length > this.productsPerView;
  }

  scrollPrev(): void {
    if (this.products.length <= this.productsPerView) return;
    
    this.productsStartIndex = 
      (this.productsStartIndex - this.productsPerView + this.products.length) % this.products.length;
  }

  scrollNext(): void {
    if (this.products.length <= this.productsPerView) return;
    
    this.productsStartIndex = 
      (this.productsStartIndex + this.productsPerView) % this.products.length;
  }

  addToCart(product: any) {
    console.log('🛒 Đã thêm vào giỏ:', product.name);
  }

  viewProductDetail(product: Product): void {
    this.router.navigate(['/products', product.slug || product._id]);
  }

  openVariantModal(product: Product): void {
    this.selectedProduct = product;
    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedProduct = null;
  }

  handleAddToCart(payload: VariantSelection): void {
    if (!this.selectedProduct) return;

    const imageString = Array.isArray(this.selectedProduct.image)
      ? this.selectedProduct.image[0]
      : this.selectedProduct.image || 'assets/images/placeholder-shirt.png';

    const cartPayload = {
      productId: this.selectedProduct._id as string,
      name: this.selectedProduct.name,
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
          this.notification.warning('Đã hết tồn kho cho sản phẩm này.');
          return;
        }

        this.notification.confirm(
          `Số lượng yêu cầu vượt quá tồn kho. Bạn có muốn thêm ${canAdd} sản phẩm còn lại không?`,
          'Xác nhận số lượng',
          'Thêm',
          'Hủy'
        ).then((confirmed) => {
          if (!confirmed) return;
        cartPayload.quantityToAdd = canAdd;
          this.addToCartFinal(cartPayload);
        });
        return;
      }

      this.addToCartFinal(cartPayload);
    });
  }

  private addToCartFinal(cartPayload: any): void {
      this.cartService.addToCart(cartPayload).subscribe({
        next: () => {
        this.notification.success(
          `Đã thêm ${cartPayload.quantityToAdd} ${this.selectedProduct!.name} vào giỏ hàng!`,
          'Thêm vào giỏ hàng'
          );
          this.closeModal();
        },
        error: (err: any) => {
          console.error('Thêm vào giỏ hàng thất bại:', err);
        this.notification.error('Thêm vào giỏ hàng thất bại.');
        },
    });
  }

  // ===== FAVORITE =====
  isFavorite(product: Product): boolean {
    return product._id ? this.favoriteIds.has(product._id) : false;
  }

  toggleFavorite(product: Product, event?: Event): void {
    event?.stopPropagation(); // tránh click lan ra card

    this.favoriteService.toggleFavorite(product).subscribe({
      next: () => {
        console.log(`${product.name} đã toggle favorite`);
        // UI sẽ tự động cập nhật nhờ subscription ở ngOnInit
      },
      error: (err) => console.error('Lỗi favorite:', err),
    });
  }

  // ===== IMAGE SLIDE =====
  getProductImages(product: Product): string[] {
    const images = product.image && Array.isArray(product.image) ? product.image : [];
    if (images.length === 0) return ['assets/images/placeholder.jpg'];
    return images;
  }

  getCurrentImageIndex(product: Product): number {
    const productId = product._id || '';
    return this.currentImageIndex[productId] || 0;
  }

  getCurrentImage(product: Product): string {
    const images = this.getProductImages(product);
    const index = this.getCurrentImageIndex(product);
    return images[index] || images[0];
  }

  startImageSlide(product: Product): void {
    const productId = product._id || '';
    const images = product.image && Array.isArray(product.image) ? product.image : [];
    
    if (images.length <= 1) return; // Không cần slide nếu chỉ có 1 ảnh

    // Clear interval cũ nếu có
    if (this.imageSlideIntervals[productId]) {
      clearInterval(this.imageSlideIntervals[productId]);
    }

    // Reset về ảnh đầu tiên
    this.currentImageIndex[productId] = 0;
    this.cdr.detectChanges();

    // Bắt đầu slide
    this.imageSlideIntervals[productId] = setInterval(() => {
      const currentIndex = this.currentImageIndex[productId] || 0;
      const nextIndex = (currentIndex + 1) % images.length;
      this.currentImageIndex[productId] = nextIndex;
      this.cdr.detectChanges();
    }, 2000); // Đổi ảnh mỗi 2 giây
  }

  stopImageSlide(product: Product): void {
    const productId = product._id || '';
    
    if (this.imageSlideIntervals[productId]) {
      clearInterval(this.imageSlideIntervals[productId]);
      delete this.imageSlideIntervals[productId];
    }

    // Reset về ảnh đầu tiên
    this.currentImageIndex[productId] = 0;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    // Cleanup tất cả intervals khi component bị destroy
    Object.keys(this.imageSlideIntervals).forEach(productId => {
      if (this.imageSlideIntervals[productId]) {
        clearInterval(this.imageSlideIntervals[productId]);
      }
    });
    this.imageSlideIntervals = {};
  }
}

