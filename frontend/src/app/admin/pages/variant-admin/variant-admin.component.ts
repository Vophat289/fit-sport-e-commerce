import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VariantService } from '../../services/variant.service';
import { ProductService } from '../../../services/product.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

// --- INTERFACES ---

interface ProductDetail {
  _id?: string;
  name: string;
}

interface SizeOption {
  _id: string;
  name: string;
}

interface ColorOption {
  _id: string;
  name: string;
  hex_code: string;
}
interface VariantPayload {
  product_id: string;
  size_id: string;
  color_id: string;
  price: number;
  quantity: number;
}
interface Variant {
  _id?: string;
  product_id: string;
  size_id: string | { _id: string; name: string };
  color_id: string | { _id: string; name: string; hex_code: string };
  price: number;
  quantity: number;
}

@Component({
  selector: 'app-variant-admin',
  templateUrl: './variant-admin.component.html',
  styleUrls: ['./variant-admin.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class VariantAdminComponent implements OnInit {
  public productId: string | null = null;
  public productName: string = 'Đang tải...';
  public variants: Variant[] = [];
  public sizes: SizeOption[] = [];
  public colors: ColorOption[] = [];
  public variantForm: FormGroup;
  public isEditMode: boolean = false;
  public editingVariantId: string | null = null;
  public isLoading: boolean = false;
  public message: { type: 'success' | 'error'; text: string } | null = null;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private variantService: VariantService,
    private productService: ProductService,
    private http: HttpClient
  ) {
    this.variantForm = this.fb.group({
      size_id: ['', Validators.required],
      color_id: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('productId');
    if (this.productId) {
      this.loadProductDetails(this.productId);
      this.loadOptions();
      this.loadVariants(this.productId);
    } else {
      this.router.navigate(['/admin/products']);
    }
  }

  loadProductDetails(productId: string): void {
    this.http.get<any>(`/api/product-detail/${productId}`).subscribe({
      next: (data) => {
        this.productName = data.name || 'Không có tên';
      },
      error: () => {
        this.productName = 'Sản phẩm không tồn tại';
      },
    });
  }

  loadOptions(): void {
    this.variantService.getSizes().subscribe((data: SizeOption[]) => {
      this.sizes = data;
    });

    this.variantService.getColors().subscribe((data: ColorOption[]) => {
      this.colors = data;
    });
  }

  loadVariants(productId: string): void {
    this.isLoading = true;
    this.variantService.getVariantsByProduct(productId).subscribe({
      next: (data: any[]) => {
        console.log('Variants loaded:', data);
        this.variants = data as Variant[];
        this.isLoading = false;
      },
      error: (err) => {
        this.showMessage('error', 'Lỗi khi tải biến thể.');
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  submitVariant(): void {
    if (this.variantForm.invalid || !this.productId) {
      this.variantForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const formValue = this.variantForm.value;

    if (!this.productId) return;
    const payload: VariantPayload = {
      product_id: this.productId,
      size_id: formValue.size_id,
      color_id: formValue.color_id,
      price: formValue.price,
      quantity: formValue.quantity,
    };
    // ------------------------------------------------------------------

    if (this.isEditMode && this.editingVariantId) {
      this.variantService // Dùng 'payload' thay vì 'newVariantData'
        .updateVariant(this.editingVariantId, payload)
        .subscribe({
          next: () => {
            this.showMessage('success', 'Cập nhật biến thể thành công.');
            this.resetForm();
            this.loadVariants(this.productId!);
          },
          error: () => this.showMessage('error', 'Lỗi khi cập nhật biến thể.'),
        });
    } else {
      // Dùng 'payload' thay vì 'newVariantData'
      this.variantService.addVariant(payload).subscribe({
        next: () => {
          this.showMessage('success', 'Thêm biến thể thành công.');
          this.resetForm();
          this.loadVariants(this.productId!);
        },
        error: () => this.showMessage('error', 'Lỗi khi thêm biến thể.'),
      });
    }
  }

  editVariant(variant: Variant): void {
    this.isEditMode = true;
    this.editingVariantId = variant._id!;
    const sizeIdToPatch =
      typeof variant.size_id === 'string'
        ? variant.size_id
        : variant.size_id._id;
    const colorIdToPatch =
      typeof variant.color_id === 'string'
        ? variant.color_id
        : variant.color_id._id;

    this.variantForm.patchValue({
      size_id: sizeIdToPatch,
      color_id: colorIdToPatch,
      price: variant.price,
      quantity: variant.quantity,
    });
  }

  deleteVariant(id: string): void {
    if (!confirm('Bạn có chắc chắn muốn xóa biến thể này?')) return;
    this.isLoading = true;
    this.variantService.deleteVariant(id).subscribe({
      next: () => {
        this.showMessage('success', 'Xóa biến thể thành công.');
        this.loadVariants(this.productId!);
      },
      error: () => {
        this.showMessage('error', 'Lỗi khi xóa biến thể.');
        this.isLoading = false;
      },
    });
  }

  resetForm(): void {
    this.isEditMode = false;
    this.editingVariantId = null;
    this.variantForm.reset({
      price: 0,
      quantity: 0,
      size_id: '',
      color_id: '',
    });
  } // --- HÀM HIỂN THỊ HỖ TRỢ (FIXED) ---
  getOptionName(id: string, options: any[]): string {
    return options.find((o) => o._id === id)?.name || 'N/A';
  }

  showMessage(type: 'success' | 'error', text: string): void {
    this.message = { type, text };
    setTimeout(() => (this.message = null), 3000);
  }
  goBackToProducts(): void {
    this.router.navigate(['/admin/products']);
  }
  /**
   * Trả về Tên Size (ưu tiên từ đối tượng populate)
   */

  getSizeDisplay(variant: any): string {
    if (typeof variant.size_id === 'object' && variant.size_id) {
      return variant.size_id.name;
    } // Nếu là string ID, gọi hàm tìm kiếm trong mảng đã load
    return this.getOptionName(variant.size_id as string, this.sizes);
  }
  /**
   * Hàm phụ trợ lấy mã màu từ mảng colors đã tải
   */
  getColorCodeFromId(id: string, colors: any[]): string {
    return colors.find((c) => c._id === id)?.hex_code || '#cccccc';
  }
  /**
   * Trả về Tên Màu hoặc Mã Màu (ưu tiên từ đối tượng populate)
   */
  getColorDisplay(variant: any, type: 'name' | 'code'): string {
    // 1. Nếu dữ liệu đã được populate (là Object)
    if (typeof variant.color_id === 'object' && variant.color_id) {
      return type === 'name'
        ? variant.color_id.name
        : variant.color_id.hex_code;
    } // 2. Nếu dữ liệu chưa được populate (là String ID)

    if (type === 'name') {
      return this.getOptionName(variant.color_id as string, this.colors);
    } else {
      // type === 'code'
      const colorCode = this.getColorCodeFromId(
        variant.color_id as string,
        this.colors
      );
      return colorCode;
    }
  }
}
