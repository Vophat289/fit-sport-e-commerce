// product-modal.component.ts
export interface VariantSelection {
  sizeId: string;
  sizeName: string;
  colorId: string;
  colorName: string;
  quantity: number;
  price: number; 
  stock: number;
}

// Interface chi tiết biến thể nhận được từ API
interface VariantDetails {
    price: number;
    quantity: number;
}

// Interface cho Kích cỡ/Màu sắc
interface AvailableOption {
    id: string;
    name: string;
    hex?: string;
}

// Interface cho dữ liệu biến thể khả dụng
interface AvailableVariants {
    availableSizes: AvailableOption[];
    availableColors: AvailableOption[];
}


import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '@app/services/product.service';
import { AuthService } from '@app/services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '@app/services/notification.service';


@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-modal.component.html',
  styleUrls: ['./product-modal.component.css'],
})
export class ProductModalComponent implements OnChanges {

  @Input() isModalOpen: boolean = false;
  @Input() selectedProduct: Product | null = null;
  
  @Output() closeModal = new EventEmitter<void>();
  @Output() confirmAddToCart = new EventEmitter<VariantSelection>();


  isVariantsLoading: boolean = false;
  
  availableVariantSizes: AvailableOption[] = []; 
  availableColors: AvailableOption[] = [];

  selectedSizeName: string | null = null;
  selectedColorName: string | null = null;
  quantityToAdd: number = 1;

  currentVariantDetails: VariantDetails | null = null;
  stockMessage: string | null = null; 
  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private router: Router,
    private notification: NotificationService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedProduct'] && this.selectedProduct) {
      console.log('selectedProduct nhận được:', this.selectedProduct);
      this.loadVariantData(this.selectedProduct);
    } else if (changes['isModalOpen'] && !this.isModalOpen) {
        // Reset trạng thái khi modal đóng
        this.resetModalState();
    }
  }

  loadVariantData(product: Product): void {
    if (!product._id) return;
    // Kiểm tra login
  // if (!this.authService.isLoggedIn()) {
  //   alert('Vui lòng đăng nhập để xem sản phẩm.');
  //   this.router.navigate(['/login']);
  //   return;
  // }

    this.isVariantsLoading = true;
    this.resetSelection();
    this.productService.getAvailableVariants(product._id).subscribe({
      next: (data: AvailableVariants) => {
        console.log('Available variants từ API:', data);
        this.availableVariantSizes = data.availableSizes; 
        this.availableColors = data.availableColors;

        // Tự động chọn biến thể đầu tiên
        this.selectedSizeName =
          data.availableSizes.length > 0 ? data.availableSizes[0].name : null;
        this.selectedColorName =
          data.availableColors.length > 0 ? data.availableColors[0].name : null;

        this.isVariantsLoading = false;
        this.updateVariantDetails();
      },
      error: (err: any) => {
        console.error('Không tải được biến thể khả dụng:', err);
        this.notification.error(
          err.error?.message || 'Sản phẩm này hiện hết hàng hoặc có lỗi xảy ra.'
        );
        this.isVariantsLoading = false;
        this.close();
      },
    });
  }
  updateVariantDetails(): void {
    if (!this.selectedProduct || !this.selectedSizeName || !this.selectedColorName) {
        this.currentVariantDetails = null;
        this.quantityToAdd = 0;
        return;
    }
    
    const size = this.availableVariantSizes.find( (s) => s.name === this.selectedSizeName );
    const color = this.availableColors.find( (c) => c.name === this.selectedColorName );

    this.currentVariantDetails = null;
    this.quantityToAdd = 1;

    if (size && color && this.selectedProduct?._id) {
      const sizeId = size.id;
      const colorId = color.id;
      const productId = this.selectedProduct._id;

      this.productService
        .getVariantDetails(productId, sizeId, colorId)
        .subscribe({
          next: (variantData: VariantDetails) => {
            const quantity = variantData.quantity || 0;
            this.currentVariantDetails = { price: variantData.price, quantity };
            if (this.quantityToAdd > quantity)
              this.quantityToAdd = quantity > 0 ? 1 : 0;
            if (quantity === 0)
              this.notification.warning('Tổ hợp Kích cỡ/Màu sắc này hiện đã hết hàng.');
          },
          error: (err: any) => {
            this.currentVariantDetails = {
              price: this.selectedProduct?.price || 0,
              quantity: 0,
            };
            this.quantityToAdd = 0;
            this.notification.warning(
              err.error?.message || 'Tổ hợp này không tồn tại hoặc hết hàng.'
            );
          },
        });
    }
  }
  decrementQuantity(): void {
    if (this.quantityToAdd > 1) this.quantityToAdd--;
  }

  incrementQuantity(): void {
    const maxQuantity = this.currentVariantDetails?.quantity || 99;
    if (this.quantityToAdd < maxQuantity) {
      this.quantityToAdd++;
    } else if(this.quantityToAdd >= maxQuantity && maxQuantity > 0) {
      this.notification.warning(`Chỉ còn ${maxQuantity} sản phẩm trong kho.`);
    }
  }

  onQuantityChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let value = parseInt(inputElement.value, 10);
    const maxQuantity = this.currentVariantDetails?.quantity || 99;

    if (isNaN(value) || value < 1) value = 1;
    else if (value > maxQuantity) {
      value = maxQuantity > 0 ? maxQuantity : 1;
      if (maxQuantity > 0) this.notification.warning(`Chỉ còn ${maxQuantity} sản phẩm trong kho.`);
    }
    
    this.quantityToAdd = value;
    inputElement.value = value.toString();
  }
  
  close(): void {
    this.closeModal.emit();
  }
  
  resetSelection(): void {
    this.availableVariantSizes = [];
    this.availableColors = [];
    this.selectedSizeName = null;
    this.selectedColorName = null;
    this.currentVariantDetails = null;
    this.quantityToAdd = 1;
  }

  resetModalState(): void {
      this.resetSelection();
      this.isVariantsLoading = false;
  }
  
  onConfirmAddToCart(): void {
    if (
        !this.selectedProduct ||
        !this.selectedSizeName ||
        !this.selectedColorName ||
        !this.currentVariantDetails ||
        this.quantityToAdd < 1
    ) {
        this.notification.warning('Vui lòng chọn Kích cỡ, Màu sắc và Số lượng hợp lệ.');
        return;
    }
    
    const actualSize = this.availableVariantSizes.find(
      (s) => s.name === this.selectedSizeName
    );
    const actualColor = this.availableColors.find(
      (c) => c.name === this.selectedColorName
    );

    if (!actualSize || !actualColor) {
        this.notification.error('Lỗi dữ liệu: Không tìm thấy biến thể đã chọn.');
        return;
    }
    
    const payload: VariantSelection = {
        sizeId: actualSize.id,
        sizeName: actualSize.name,
        colorId: actualColor.id,
        colorName: actualColor.name,
        quantity: this.quantityToAdd,
        price: this.currentVariantDetails.price,
        stock: this.currentVariantDetails.quantity
    };
    
    this.confirmAddToCart.emit(payload);
  }
}