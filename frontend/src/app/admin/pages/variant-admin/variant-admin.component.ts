import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { VariantService } from '../../services/variant.service';
import { ProductService } from '../../../services/product.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../services/notification.service';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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

  public newSize: string = '';
  public newColor: string = '';
  public newColorHex: string = '#000000';

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private variantService: VariantService,
    private productService: ProductService,
    private http: HttpClient,
    private notification: NotificationService
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
      this.loadProductDetails(this.productId);
    } else {
      this.router.navigate(['/admin/products']);
    }
  }

  loadProductDetails(productId: string): void {
    this.variantService.getProductDetails(productId).subscribe({
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

    if (this.isEditMode && this.editingVariantId) {
      this.variantService
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
    this.variantForm.get('size_id')?.disable();
    this.variantForm.get('color_id')?.disable();
  }

  deleteVariant(id: string): void {
    this.notification.confirmDelete('biến thể này').then((confirmed) => {
      if (!confirmed) return;
      this.isLoading = true;
      this.variantService.deleteVariant(id).subscribe({
        next: () => {
          this.notification.success('Xóa biến thể thành công.');
          this.loadVariants(this.productId!);
        },
        error: () => {
          this.notification.error('Lỗi khi xóa biến thể.');
          this.isLoading = false;
        },
      });
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
  }
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
  getSizeDisplay(variant: any): string {
    if (typeof variant.size_id === 'object' && variant.size_id) {
      return variant.size_id.name;
    }
    return this.getOptionName(variant.size_id as string, this.sizes);
  }
  getColorCodeFromId(id: string, colors: any[]): string {
    return colors.find((c) => c._id === id)?.hex_code || '#cccccc';
  }
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
      const colorCode = this.getColorCodeFromId(
        variant.color_id as string,
        this.colors
      );
      return colorCode;
    }
  }
  createSize() {
    if (!this.newSize.trim()) return;

    this.variantService.addSize(this.newSize).subscribe({
      next: (res) => {
        this.showMessage('success', 'Thêm size thành công');
        this.newSize = '';
        this.loadOptions(); // load lại danh sách size
      },
      error: () => this.showMessage('error', 'Size đã tồn tại hoặc lỗi server'),
    });
  }
  createColor() {
    if (!this.newColor.trim()) return;

    const payload = {
      name: this.newColor,
      hex_code: this.newColorHex,
    };

    this.variantService.addColor(payload).subscribe({
      next: () => {
        this.showMessage('success', 'Thêm màu thành công');
        this.newColor = '';
        this.newColorHex = '#000000';
        this.loadOptions();
      },
      error: () => this.showMessage('error', 'Màu đã tồn tại hoặc lỗi server'),
    });
  }
}
