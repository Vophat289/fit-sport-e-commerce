import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  selector: 'app-home-product',
  imports: [CommonModule, ProductModalComponent],
  templateUrl: './home-product.component.html',
  styleUrl: './home-product.component.css',
})
export class HomeProductComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  isModalOpen: boolean = false;
  selectedProduct: Product | null = null;

  // ===== FAVORITE =====
  favoriteIds: Set<string> = new Set();

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
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products = [...data].sort(
          (a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi tải sản phẩm: ', err);
        this.loading = false;
      },
    });
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
}
