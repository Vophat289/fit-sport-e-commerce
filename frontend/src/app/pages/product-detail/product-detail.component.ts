import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product, VariantDetails } from '@app/services/product.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, AddCartPayload } from '@app/services/cart.service';
import { AuthService } from '@app/services/auth.service';
import { AccountService } from '@app/services/account.service';
import { FavoriteService } from '@app/services/favorite.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;

  loading: boolean = true;
  error: string | null = null;

  selectedImageIndex: number = 0;
  selectedColor: string | null = null;
  selectedSize: string | null = null;

  quantity: number = 1;
  quantityToAdd: number = 1;
  currentVariantDetails: VariantDetails | null = null;
  stockMessage: string | null = null;

  // ================= REVIEW =================
  reviews: any[] = [];
  filteredReviews: any[] = [];
  loadingReviews: boolean = false;
  averageRating: number = 0;
  selectedStar: number | null = null;

  // ================= TAB =================
  activeTab: 'description' | 'reviews' = 'description';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private accountService: AccountService,
    private favoriteService: FavoriteService // ❤️ FAVORITE
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadProduct(slug);
    } else {
      this.router.navigate(['/products']);
    }
  }

  // ================= TAB =================
  switchTab(tab: 'description' | 'reviews'): void {
    this.activeTab = tab;
    if (tab === 'reviews' && this.product?._id && this.reviews.length === 0) {
      this.loadReviews(this.product._id);
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

        if (this.product.availableColors.length) {
          this.selectedColor = this.product.availableColors[0].id;
        }
        if (this.product.availableSizes.length) {
          this.selectedSize = this.product.availableSizes[0].id;
        }

        this.updateVariantDetails();
        this.incrementViewCount(slug);

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

  // ================= REVIEW =================
  loadReviews(productId: string): void {
    this.loadingReviews = true;
    this.accountService.getProductReviews(productId).subscribe({
      next: (res: any) => {
        console.log('Reviews response:', res);
        this.reviews = (res.data || res || []).map((r: any) => ({
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
      error: (err) => {
        console.error('Lỗi khi tải đánh giá:', err);
        this.loadingReviews = false;
        this.reviews = [];
        this.filteredReviews = [];
      },
    });
  }

  filterByStar(star: number | null): void {
    this.selectedStar = star;
    this.filteredReviews = star
      ? this.reviews.filter((r) => r.rating === star)
      : [...this.reviews];
  }

  calculateAverageRating(): void {
    if (!this.reviews.length) {
      this.averageRating = 0;
      return;
    }
    const total = this.reviews.reduce((s, r) => s + (r.rating || 0), 0);
    this.averageRating = +(total / this.reviews.length).toFixed(1);
  }

  markHelpful(reviewId: string): void {
    const review = this.reviews.find((r) => r._id === reviewId);
    if (!review) return;

    review.isClicked = !review.isClicked;
    review.helpfulCount += review.isClicked ? 1 : -1;
  }

  // ================= IMAGE =================
  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  // ================= VARIANT =================
  selectColor(colorId: string): void {
    this.selectedColor = colorId;
    this.updateVariantDetails();
  }

  selectSize(sizeId: string): void {
    this.selectedSize = sizeId;
    this.updateVariantDetails();
  }

  updateVariantDetails(): void {
    this.stockMessage = null;

    if (!this.product || !this.selectedColor || !this.selectedSize) {
      this.currentVariantDetails = null;
      return;
    }

    this.productService
      .getVariantDetails(this.product._id!, this.selectedSize, this.selectedColor)
      .subscribe({
        next: (v) => {
          this.currentVariantDetails = {
            price: v.price,
            quantity: v.quantity || 0,
          };
          if (v.quantity === 0) {
            this.stockMessage = 'Phiên bản sản phẩm này đã hết hàng.';
          }
        },
        error: () => {
          this.currentVariantDetails = { price: this.product!.price, quantity: 0 };
          this.stockMessage = 'Phiên bản sản phẩm này đã hết hàng.';
        },
      });
  }

  // ================= CART =================
  increaseQuantity(): void {
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) this.quantity--;
  }

  addToCart(): void {
    if (!this.product || !this.selectedColor || !this.selectedSize) return;

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
      sizeName: this.product.availableSizes?.find(s => s.id === this.selectedSize)?.name || '—',
      colorId: this.selectedColor,
      colorName: this.product.availableColors?.find(c => c.id === this.selectedColor)?.name || '—',
      stock: this.currentVariantDetails.quantity,
    };

    this.cartService.addToCart(payload).subscribe({
      next: () => (this.stockMessage = `Đã thêm ${this.quantity} sản phẩm vào giỏ.`),
      error: () => (this.stockMessage = 'Không thể thêm vào giỏ.'),
    });
  }

  buyNow(): void {
    if (!this.product || !this.selectedColor || !this.selectedSize) return;

    if (!this.currentVariantDetails || this.currentVariantDetails.quantity === 0) {
      this.stockMessage = 'Phiên bản sản phẩm này đã hết hàng.';
      return;
    }

    // First, check if this item already exists in cart and remove it
    // This ensures we SET the quantity instead of ADDING to it
    this.cartService.getCartDetails().subscribe({
      next: (cartDetails) => {
        // Find existing item with same variant
        const existingItem = cartDetails.items.find(item => 
          item.variant_id === this.product!._id &&
          item.sizeId === this.selectedSize &&
          item.colorId === this.selectedColor
        );

        // If item exists, delete it first
        const deletePromise = existingItem 
          ? this.cartService.deleteCartItem(existingItem._id).toPromise()
          : Promise.resolve();

        deletePromise.then(() => {
          // Now add the item with the exact quantity selected
          const payload: AddCartPayload = {
            productId: this.product!._id!,
            name: this.product!.name,
            image: this.product!.image?.[0] || '',
            price: this.currentVariantDetails!.price,
            quantityToAdd: this.quantity,
            sizeId: this.selectedSize!,
            sizeName: this.product!.availableSizes?.find(s => s.id === this.selectedSize)?.name || '—',
            colorId: this.selectedColor!,
            colorName: this.product!.availableColors?.find(c => c.id === this.selectedColor)?.name || '—',
            stock: this.currentVariantDetails!.quantity,
          };

          this.cartService.addToCart(payload).subscribe({
            next: () => {
              // Get the cart again to find the newly added item
              this.cartService.getCartDetails().subscribe({
                next: (updatedCart) => {
                  const newItem = updatedCart.items.find(item => 
                    item.variant_id === this.product!._id &&
                    item.sizeId === this.selectedSize &&
                    item.colorId === this.selectedColor
                  );

                  if (newItem) {
                    // Set only this item as selected for checkout
                    const selectedItems = [newItem];
                    localStorage.setItem('selectedCartItems', JSON.stringify(selectedItems));
                    
                    // Navigate to checkout page
                    this.router.navigate(['/checkout']);
                  } else {
                    this.stockMessage = 'Không thể tìm thấy sản phẩm trong giỏ hàng.';
                  }
                },
                error: () => {
                  this.stockMessage = 'Không thể lấy thông tin giỏ hàng.';
                }
              });
            },
            error: () => {
              this.stockMessage = 'Không thể thêm vào giỏ.';
            },
          });
        }).catch(() => {
          this.stockMessage = 'Lỗi khi xóa sản phẩm cũ trong giỏ hàng.';
        });
      },
      error: () => {
        this.stockMessage = 'Không thể lấy thông tin giỏ hàng.';
      }
    });
  }

  // ================= FAVORITE ❤️ =================
  toggleFavorite(): void {
    if (!this.product) return;

    this.favoriteService.toggleFavorite(this.product).subscribe({
      error: (err) => console.error('Toggle favorite thất bại', err),
    });
  }

  get isProductFavorite(): boolean {
    return this.favoriteService.isFavorite(this.product?._id);
  }

  // ================= VIEW =================
  incrementViewCount(slug: string): void {
    this.productService.incrementView(slug).subscribe({
      next: (res) => {
        if (this.product) this.product.viewCount = res.viewCount;
      },
    });
  }
}
