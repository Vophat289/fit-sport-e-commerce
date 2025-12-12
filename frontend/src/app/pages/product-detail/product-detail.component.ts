import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product, VariantDetails } from '@app/services/product.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, AddCartPayload } from '@app/services/cart.service';
import { AuthService } from '@app/services/auth.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;

  loading: boolean = true;
  error: string | null = null;

  selectedImageIndex: number = 0;
  selectedColor: string | null = null;
  selectedSize: string | null = null;

  quantity: number = 1;
  currentVariantDetails: VariantDetails | null = null;
  quantityToAdd: number = 1;
  stockMessage: string | null = null;

  // ===== FAVORITE =====
  favoriteProducts: string[] = [];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    // Load danh sách yêu thích từ localStorage
    this.favoriteProducts = JSON.parse(localStorage.getItem('favorite_products') || '[]');

    if (slug) {
      this.loadProduct(slug);
    } else {
      this.router.navigate(['/products']);
    }
  }

  loadProduct(slug: string): void {
    this.loading = true;
    this.error = null;

    this.productService.getBySlugProduct(slug).subscribe({
      next: (data) => {
        this.product = data;
        this.product.availableColors = data.availableColors ?? [];
        this.product.availableSizes = data.availableSizes ?? [];

        if (this.product.availableColors.length > 0) {
          this.selectedColor = this.product.availableColors[0].id;
        }

        if (this.product.availableSizes.length > 0) {
          this.selectedSize = this.product.availableSizes[0].id;
        }

        this.updateVariantDetails();
        this.loading = false;
        this.incrementViewCount(slug);
      },
      error: (err) => {
        console.error('Lỗi tải sản phẩm', err);
        this.error = 'Không tìm thấy sản phẩm';
        this.loading = false;

        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 2000);
      },
    });
  }

  // ==== IMAGE ====
  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  // ==== COLOR / SIZE ====
  selectColor(colorId: string): void {
    this.selectedColor = colorId;
    this.updateVariantDetails();
  }

  selectSize(sizeId: string): void {
    this.selectedSize = sizeId;
    this.updateVariantDetails();
  }

  // ==== QUANTITY ====
  increaseQuantity(): void {
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) this.quantity--;
  }

  // ==== VIEW COUNT ====
  incrementViewCount(slug: string): void {
    this.productService.incrementView(slug).subscribe({
      next: (data) => {
        if (this.product) this.product.viewCount = data.viewCount;
      },
      error: (err) => console.error('Lỗi tăng lượt xem', err),
    });
  }

  // ==== VARIANT DETAILS ====
  updateVariantDetails(): void {
    this.stockMessage = null;
    if (!this.product || !this.selectedColor || !this.selectedSize) {
      this.currentVariantDetails = null;
      this.quantityToAdd = 0;
      return;
    }

    const productId = this.product._id!;
    const sizeId = this.selectedSize;
    const colorId = this.selectedColor;

    this.productService.getVariantDetails(productId, sizeId, colorId).subscribe({
      next: (variantData: VariantDetails) => {
        const quantity = variantData.quantity || 0;
        this.currentVariantDetails = { price: variantData.price, quantity };
        if (this.quantityToAdd > quantity) this.quantityToAdd = quantity > 0 ? 1 : 0;
        if (quantity === 0) this.stockMessage = 'Phiên bản sản phẩm này đã hết hàng.';
      },
      error: () => {
        this.currentVariantDetails = { price: this.product?.price || 0, quantity: 0 };
        this.quantityToAdd = 0;
        this.stockMessage = 'Phiên bản sản phẩm này đã hết hàng.';
      },
    });
  }

  // ==== ADD TO CART ====
  addToCart(): void {
    if (!this.product || !this.selectedColor || !this.selectedSize) {
      alert('Vui lòng chọn màu và size.');
      return;
    }

    if (!this.currentVariantDetails || this.currentVariantDetails.quantity === 0) {
      this.stockMessage = 'Phiên bản sản phẩm này đã hết hàng.';
      return;
    }

    const cart = JSON.parse(localStorage.getItem('my_cart') || '{"items":[]}');
    const existingItem = cart.items.find(
      (i: any) =>
        i.variant_id === this.product!._id &&
        i.sizeId === this.selectedSize &&
        i.colorId === this.selectedColor
    );

    const alreadyInCart = existingItem ? existingItem.quantityToAdd : 0;
    const availableStock = this.currentVariantDetails.quantity - alreadyInCart;

    if (availableStock <= 0) {
      this.stockMessage = 'Phiên bản sản phẩm này đã hết hàng.';
      return;
    }

    if (this.quantity > availableStock) {
      this.quantity = availableStock;
      this.stockMessage = `Chỉ còn ${availableStock} sản phẩm trong kho.`;
      return;
    }

    const payload: AddCartPayload = {
      productId: this.product._id!,
      name: this.product.name,
      image: this.product.image ? this.product.image[0] : '',
      price: this.currentVariantDetails.price,
      quantityToAdd: this.quantity,
      sizeId: this.selectedSize,
      sizeName:
        this.product.availableSizes?.find((s) => s.id === this.selectedSize)?.name || '—',
      colorId: this.selectedColor,
      colorName:
        this.product.availableColors?.find((c) => c.id === this.selectedColor)?.name || '—',
      stock: this.currentVariantDetails.quantity,
    };

    this.cartService.addToCart(payload).subscribe({
      next: () => {
        const totalAdded = alreadyInCart + this.quantity;
        this.stockMessage =
          `Đã thêm ${this.quantity} sản phẩm vào giỏ.` +
          (alreadyInCart > 0 ? ` Tổng số sản phẩm trong giỏ: ${totalAdded}.` : '');
      },
      error: () => {
        this.stockMessage = 'Không thể thêm vào giỏ. Vui lòng thử lại.';
      },
    });
  }

  // ==== FAVORITE ====
  toggleFavorite(): void {
    if (!this.product || !this.product._id) return;

    const productId = this.product._id;
    const index = this.favoriteProducts.indexOf(productId);

    if (index > -1) {
      this.favoriteProducts.splice(index, 1);
    } else {
      this.favoriteProducts.push(productId);
    }

    localStorage.setItem('favorite_products', JSON.stringify(this.favoriteProducts));
  }

  get isProductFavorite(): boolean {
    return this.product?._id ? this.favoriteProducts.includes(this.product._id) : false;
  }
}
