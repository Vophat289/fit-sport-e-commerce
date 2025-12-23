import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FavoriteService, Product } from '../../services/favorite.service';
import { ProductService, Product as ProductServiceProduct } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ProductModalComponent, VariantSelection } from '../../components/product-modal/product-modal.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-favorite',
  standalone: true,
  imports: [CommonModule, ProductModalComponent],
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.css'],
})
export class FavoriteComponent {

  favorites: Product[] = [];
  loading = true;
  isModalOpen: boolean = false;
  selectedProduct: ProductServiceProduct | null = null;

  constructor(
    private favoriteService: FavoriteService,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    // Lắng nghe danh sách yêu thích
    this.favoriteService.favorites$.subscribe(data => {
      this.favorites = data;
      this.loading = false;
    });
  }

  goToProduct(slug?: string) {
    if (slug) this.router.navigate(['/products', slug]);
  }

  /** Xóa khỏi danh sách yêu thích */
  removeFavorite(product: Product) {
    if (!product._id) return;
    this.favoriteService.removeFavorite(product._id).subscribe({
      next: () => {
        this.favorites = this.favorites.filter(p => p._id !== product._id);
      },
      error: (err) => console.error('Xóa yêu thích thất bại', err)
    });
  }

  /** Toggle yêu thích */
  toggleFavorite(product: Product) {
    if (!product._id) return;
    this.favoriteService.toggleFavorite(product).subscribe({
      next: () => {
        // Cập nhật trạng thái active
        const idx = this.favorites.findIndex(p => p._id === product._id);
        if (idx === -1) {
          this.favorites.push(product);
        } else {
          this.favorites.splice(idx, 1);
        }
      },
      error: (err) => console.error('Toggle yêu thích thất bại', err)
    });
  }

  isFavorite(product: Product) {
    return this.favoriteService.isFavorite(product._id);
  }

  /** Mở modal chọn variant để thêm vào giỏ hàng */
  openVariantModal(product: Product): void {
    if (!product._id) return;
    
    // Lấy thông tin sản phẩm đầy đủ từ ProductService
    this.productService.getBySlugProduct(product.slug || product._id).subscribe({
      next: (fullProduct) => {
        this.selectedProduct = fullProduct;
        this.isModalOpen = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi lấy thông tin sản phẩm:', err);
        // Nếu không lấy được qua slug, thử dùng thông tin cơ bản
        this.selectedProduct = {
          _id: product._id,
          name: product.name,
          price: product.displayPrice || product.price,
          image: product.image,
          slug: product.slug
        } as ProductServiceProduct;
        this.isModalOpen = true;
        this.cdr.detectChanges();
      }
    });
  }

  /** Đóng modal */
  closeModal(): void {
    this.isModalOpen = false;
    this.selectedProduct = null;
  }

  /** Xử lý thêm vào giỏ hàng từ modal */
  handleAddToCart(payload: VariantSelection): void {
    if (!this.selectedProduct) return;

    const imageString = Array.isArray(this.selectedProduct.image)
      ? this.selectedProduct.image[0]
      : this.selectedProduct.image || 'assets/images/placeholder.jpg';

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
      error: (err) => {
        console.error('Thêm vào giỏ hàng thất bại:', err);
        this.notification.error('Thêm vào giỏ hàng thất bại.');
      },
    });
  }

}