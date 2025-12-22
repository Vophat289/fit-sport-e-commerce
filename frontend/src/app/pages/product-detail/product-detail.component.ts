import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '@app/services/product.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VariantDetails } from '@app/services/product.service';
import { CartService, AddCartPayload } from '@app/services/cart.service';
import { AuthService } from '@app/services/auth.service';
import { AccountService } from '@app/services/account.service';

@Component({
  selector: 'app-product-detail',
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
  currentVariantDetails: VariantDetails | null = null;
  quantityToAdd: number = 1;
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
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (slug) {
      this.loadProduct(slug);
    } else {
      //k có thì quay về trang sp
      this.router.navigate(['/products']);
    }
  }
  switchTab(tab: 'description' | 'reviews') {
    this.activeTab = tab;
    if (tab === 'reviews' && this.product?._id && this.reviews.length === 0) {
      this.loadReviews(this.product._id);
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
        if (this.product._id) {
          this.loadReviews(this.product._id);
        }
      },
      error: (err) => {
        console.error('Lỗi tải sản phẩm', err);
        this.error = 'Không tìm thấy sản phẩm';
        this.loading = false;

        //quay về trang sp
        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 2000);
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

  //color
  selectColor(colorId: string): void {
    this.selectedColor = colorId;
    this.updateVariantDetails();
  }

  //size
  selectSize(sizeId: string): void {
    this.selectedSize = sizeId;
    this.updateVariantDetails();
  }

  increaseQuantity(): void {
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  //hàm lượt xem
  incrementViewCount(slug: string): void {
    this.productService.incrementView(slug).subscribe({
      next: (data) => {
        if (this.product) {
          this.product.viewCount = data.viewCount;
        }
      },
      error: (err) => {
        console.error('Lỗi tăng lượt xem', err);
      },
    });
  }
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

    this.productService
      .getVariantDetails(productId, sizeId, colorId)
      .subscribe({
        next: (variantData: VariantDetails) => {
          const quantity = variantData.quantity || 0;

          this.currentVariantDetails = {
            price: variantData.price,
            quantity,
          };

          if (this.quantityToAdd > quantity) {
            this.quantityToAdd = quantity > 0 ? 1 : 0;
          }

          if (quantity === 0) {
            this.stockMessage = 'Phiên bản sản phẩm này đã hết hàng.';
          }
        },
        error: () => {
          this.currentVariantDetails = {
            price: this.product?.price || 0,
            quantity: 0,
          };
          this.quantityToAdd = 0;

          this.stockMessage = 'Phiên bản sản phẩm này đã hết hàng.';
        },
      });
  }
addToCart(): void {
  if (!this.product || !this.selectedColor || !this.selectedSize) {
    alert('Vui lòng chọn màu và size.');
    return;
  }

  if (!this.currentVariantDetails || this.currentVariantDetails.quantity === 0) {
    this.stockMessage = 'Phiên bản sản phẩm này đã hết hàng.';
    return;
  }

  // Lấy giỏ từ localStorage
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
    next: (res) => {
      const totalAdded = alreadyInCart + this.quantity;
      this.stockMessage = `Đã thêm ${this.quantity} sản phẩm vào giỏ.` +
        (alreadyInCart > 0 ? ` Tổng số sản phẩm trong giỏ: ${totalAdded}.` : '');
    },
    error: (err) => {
      this.stockMessage = 'Không thể thêm vào giỏ. Vui lòng thử lại.';  
    },
  });
}
//mua ngay
  buyNow(): void {
    if (!this.product || !this.selectedColor || !this.selectedSize) {
      alert('Vui lòng chọn màu và size');
      return;
    }

    if (!this.currentVariantDetails || this.currentVariantDetails.quantity === 0) {
      this.stockMessage = 'Phiên bản sản phẩm này đã hết hàng.';
      return;
    }

    if (this.quantity > this.currentVariantDetails.quantity) {
      this.stockMessage = `Chỉ còn ${this.currentVariantDetails.quantity} sản phẩm trong kho.`;
      return;
    }

    const buyNowItem = {
      productId: this.product._id,
      name: this.product.name,
      image: this.product.image ? this.product.image[0] : '',
      price: this.currentVariantDetails.price,
      quantityToAdd: this.quantity,
      sizeId: this.selectedSize,
      sizeName:
        this.product.availableSizes?.find(s => s.id === this.selectedSize)?.name || '',
      colorId: this.selectedColor,
      colorName:
        this.product.availableColors?.find(c => c.id === this.selectedColor)?.name || '',
      variant_id: `${this.product._id}_${this.selectedSize}_${this.selectedColor}`
    };

    // 🔥 MẤU CHỐT: ghi đè selectedCartItems
    localStorage.setItem(
      'selectedCartItems',
      JSON.stringify([buyNowItem])
    );

    // ❌ không đụng my_cart
    // ❌ không sync cart

    this.router.navigate(['/checkout']);
  }
}
