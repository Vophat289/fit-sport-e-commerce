import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product, VariantDetails } from '@app/services/product.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, AddCartPayload } from '@app/services/cart.service';
import { AuthService } from '@app/services/auth.service';
import { FavoriteService } from '@app/services/favorite.service';
import { AccountService } from '@app/services/account.service'; // ✅ THÊM

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;

  loading = true;
  error: string | null = null;

  selectedImageIndex = 0;
  selectedColor: string | null = null;
  selectedSize: string | null = null;

  quantity = 1;
  currentVariantDetails: VariantDetails | null = null;
  quantityToAdd = 1;
  stockMessage: string | null = null;

  //review
  reviews: any[] = [];
  loadingReviews: boolean = false;
  averageRating: number = 0;
  filteredReviews: any[] = [];
  selectedStar: number | null = null;
  // Tab quản lý
  activeTab: 'description' | 'reviews' = 'description';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private favoriteService: FavoriteService,
    private accountService: AccountService // ✅ THÊM
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (slug) {
      this.loadProduct(slug);
    } else {
      this.router.navigate(['/products']);
    }
  }

  // ================= PRODUCT =================
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
        this.incrementViewCount(slug);
        
        // Load reviews for this product
        if (this.product._id) {
          this.loadReviews(this.product._id);
        }
        
        this.loading = false;
      },
      error: () => {
        this.error = 'Không tìm thấy sản phẩm';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/products']), 2000);
      },
    });
  }

    loadReviews(productId: string): void {
      this.loadingReviews = true;
      this.accountService.getProductReviews(productId).subscribe({
        next: (res: any) => {
          this.reviews = (res.data || []).map((r: any) => ({
            ...r,
            sizeName: r.variant?.size_id?.name || null,
            colorName: r.variant?.color_id?.name || null,
            isClicked: false,
            helpfulCount: r.helpfulCount || 0,
          }));
          
          this.filteredReviews = [...this.reviews];
          this.calculateAverageRating();
          this.loadingReviews = false;
        },
        error: (err: any) => {
          console.error('Lỗi khi load review:', err);
          this.loadingReviews = false;
        },
      });
}
  filterByStar(star: number | null): void {
    this.selectedStar = star;

    if (!star) {
      this.filteredReviews = [...this.reviews]; // tất cả
    } else {
      this.filteredReviews = this.reviews.filter(
        (r) => r.rating === star
      );
    }
  }
  calculateAverageRating(): void {
    if (!this.reviews.length) {
      this.averageRating = 0;
      return;
    }

    const totalStars = this.reviews.reduce(
      (sum, r) => sum + (r.rating || 0),
      0
    );

    this.averageRating = +(totalStars / this.reviews.length).toFixed(1);
  }

markHelpful(reviewId: string): void {
  const review = this.reviews.find((r: any) => r._id === reviewId); 

  if (review) {
    if (review.isClicked) {
      review.helpfulCount -= 1;
      review.isClicked = false;
      console.log(`Un-liked review ${reviewId}. New count: ${review.helpfulCount}`);
    } else {
      review.helpfulCount += 1;
      review.isClicked = true;
      console.log(`Liked review ${reviewId}. New count: ${review.helpfulCount}`);
    }
  }
}
  //image
  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  // ================= COLOR / SIZE =================
  selectColor(colorId: string): void {
    this.selectedColor = colorId;
    this.updateVariantDetails();
  }

  selectSize(sizeId: string): void {
    this.selectedSize = sizeId;
    this.updateVariantDetails();
  }

  // ================= QUANTITY =================
  increaseQuantity(): void {
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) this.quantity--;
  }

  // ================= VIEW COUNT =================
  incrementViewCount(slug: string): void {
    this.productService.incrementView(slug).subscribe({
      next: (data) => {
        if (this.product) this.product.viewCount = data.viewCount;
      },
    });
  }

  // ================= VARIANT =================
  updateVariantDetails(): void {
    this.stockMessage = null;

    if (!this.product || !this.selectedColor || !this.selectedSize) {
      this.currentVariantDetails = null;
      this.quantityToAdd = 0;
      return;
    }

    this.productService
      .getVariantDetails(this.product._id!, this.selectedSize, this.selectedColor)
      .subscribe({
        next: (variant) => {
          const quantity = variant.quantity || 0;
          this.currentVariantDetails = { price: variant.price, quantity };

          if (quantity === 0) {
            this.stockMessage = 'Phiên bản sản phẩm này đã hết hàng.';
          }
        },
        error: () => {
          this.currentVariantDetails = { price: this.product?.price || 0, quantity: 0 };
          this.stockMessage = 'Phiên bản sản phẩm này đã hết hàng.';
        },
      });
  }

  // ================= ADD TO CART =================
  addToCart(): void {
    if (!this.product || !this.selectedColor || !this.selectedSize) {
      alert('Vui lòng chọn màu và size.');
      return;
    }

    if (!this.currentVariantDetails || this.currentVariantDetails.quantity === 0) {
      this.stockMessage = 'Phiên bản sản phẩm này đã hết hàng.';
      return;
    }

    const payload: AddCartPayload = {
      productId: this.product._id!,
      name: this.product.name,
      image: this.product.image?.[0] || '',
      price: this.currentVariantDetails.price,
      quantityToAdd: this.quantity,
      sizeId: this.selectedSize,
      sizeName:
        this.product.availableSizes?.find(s => s.id === this.selectedSize)?.name || '—',
      colorId: this.selectedColor,
      colorName:
        this.product.availableColors?.find(c => c.id === this.selectedColor)?.name || '—',
      stock: this.currentVariantDetails.quantity,
    };

    this.cartService.addToCart(payload).subscribe({
      next: () => {
        this.stockMessage = `Đã thêm ${this.quantity} sản phẩm vào giỏ.`;
      },
      error: () => {
        this.stockMessage = 'Không thể thêm vào giỏ. Vui lòng thử lại.';
      },
    });
  }

  // ================= FAVORITE (ĐÃ FIX) =================
  toggleFavorite(): void {
    if (!this.product) return;

    this.favoriteService.toggleFavorite(this.product).subscribe({
      error: (err) => console.error('Toggle favorite thất bại', err),
    });
  }

  get isProductFavorite(): boolean {
    return this.favoriteService.isFavorite(this.product?._id);
  }

  // ================= TAB SWITCHING =================
  switchTab(tab: 'description' | 'reviews'): void {
    this.activeTab = tab;
  }
}
