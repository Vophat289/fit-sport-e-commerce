import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product, VariantDetails } from '@app/services/product.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService, AddCartPayload } from '@app/services/cart.service';
import { AuthService } from '@app/services/auth.service';
import { AccountService } from '@app/services/account.service';
import { FavoriteService } from '@app/services/favorite.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit, OnDestroy {
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

  // ================= RELATED PRODUCTS =================
  relatedProducts: Product[] = [];
  loadingRelatedProducts: boolean = false;
  currentImageIndex: { [productId: string]: number } = {};
  imageSlideIntervals: { [productId: string]: any } = {};
  relatedProductsStartIndex: number = 0;
  relatedProductsPerView: number = 4; // Số sản phẩm hiển thị mỗi lần (mặc định desktop)
  
  // Subscription để cleanup
  private routeSubscription?: Subscription;

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
    this.updateProductsPerView();
    
    // Subscribe vào route params để reload khi slug thay đổi
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
    if (slug) {
      this.loadProduct(slug);
        // Scroll to top khi chuyển trang
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.router.navigate(['/products']);
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.updateProductsPerView();
  }

  updateProductsPerView(): void {
    const width = window.innerWidth;
    if (width <= 480) {
      this.relatedProductsPerView = 1;
    } else if (width <= 768) {
      this.relatedProductsPerView = 2;
    } else if (width <= 1024) {
      this.relatedProductsPerView = 3;
    } else {
      this.relatedProductsPerView = 4;
    }
    // Reset index khi thay đổi số lượng hiển thị
    if (this.relatedProducts.length > 0) {
      this.relatedProductsStartIndex = 0;
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
          this.loadRelatedProducts(this.product._id);
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

  // ================= RELATED PRODUCTS =================
  loadRelatedProducts(productId: string): void {
    this.loadingRelatedProducts = true;
    this.productService.getRelatedProducts(productId, 10).subscribe({
      next: (products) => {
        this.relatedProducts = products;
        this.relatedProductsStartIndex = 0;
        this.loadingRelatedProducts = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải sản phẩm liên quan:', err);
        this.relatedProducts = [];
        this.loadingRelatedProducts = false;
      },
    });
  }

  getVisibleRelatedProducts(): Product[] {
    const endIndex = this.relatedProductsStartIndex + this.relatedProductsPerView;
    const visible = this.relatedProducts.slice(this.relatedProductsStartIndex, endIndex);
    
    // Nếu chưa đủ số lượng, lấy thêm từ đầu (vòng lặp)
    if (visible.length < this.relatedProductsPerView && this.relatedProducts.length > 0) {
      const remaining = this.relatedProductsPerView - visible.length;
      const fromStart = this.relatedProducts.slice(0, remaining);
      return [...visible, ...fromStart];
    }
    
    return visible;
  }

  canScrollPrev(): boolean {
    return this.relatedProducts.length > this.relatedProductsPerView;
  }

  canScrollNext(): boolean {
    return this.relatedProducts.length > this.relatedProductsPerView;
  }

  scrollRelatedProductsPrev(): void {
    if (this.relatedProducts.length <= this.relatedProductsPerView) return;
    
    this.relatedProductsStartIndex = 
      (this.relatedProductsStartIndex - this.relatedProductsPerView + this.relatedProducts.length) % this.relatedProducts.length;
  }

  scrollRelatedProductsNext(): void {
    if (this.relatedProducts.length <= this.relatedProductsPerView) return;
    
    this.relatedProductsStartIndex = 
      (this.relatedProductsStartIndex + this.relatedProductsPerView) % this.relatedProducts.length;
  }

  viewProductDetail(product: Product): void {
    if (product.slug || product._id) {
      // Scroll to top trước khi navigate
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Navigate đến trang chi tiết sản phẩm (ưu tiên slug, fallback về _id)
      this.router.navigate(['/products', product.slug || product._id]).then(() => {
        // Component sẽ tự động reload thông qua route params subscription trong ngOnInit
      });
    }
  }

  getProductImages(product: Product): string[] {
    const images = product.image && Array.isArray(product.image) ? product.image : [];
    if (images.length === 0) return ['assets/images/placeholder.jpg'];
    return images;
  }

  getCurrentImageIndex(product: Product): number {
    const productId = product._id || '';
    return this.currentImageIndex[productId] || 0;
  }

  startImageSlide(product: Product): void {
    const productId = product._id || '';
    const images = product.image && Array.isArray(product.image) ? product.image : [];
    
    if (images.length <= 1) return;

    if (this.imageSlideIntervals[productId]) {
      clearInterval(this.imageSlideIntervals[productId]);
    }

    this.currentImageIndex[productId] = 0;

    this.imageSlideIntervals[productId] = setInterval(() => {
      const currentIndex = this.currentImageIndex[productId] || 0;
      const nextIndex = (currentIndex + 1) % images.length;
      this.currentImageIndex[productId] = nextIndex;
    }, 2000);
  }

  stopImageSlide(product: Product): void {
    const productId = product._id || '';
    
    if (this.imageSlideIntervals[productId]) {
      clearInterval(this.imageSlideIntervals[productId]);
      delete this.imageSlideIntervals[productId];
    }

    this.currentImageIndex[productId] = 0;
  }

  isFavorite(product: Product): boolean {
    return this.favoriteService.isFavorite(product._id);
  }

  toggleFavoriteRelated(product: Product, event: Event): void {
    event.stopPropagation();
    this.favoriteService.toggleFavorite(product).subscribe({
      error: (err) => console.error('Toggle favorite thất bại', err),
    });
  }

  ngOnDestroy(): void {
    // Cleanup route subscription
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    
    // Cleanup tất cả intervals khi component bị destroy
    Object.keys(this.imageSlideIntervals).forEach(productId => {
      if (this.imageSlideIntervals[productId]) {
        clearInterval(this.imageSlideIntervals[productId]);
      }
    });
    this.imageSlideIntervals = {};
  }
}
