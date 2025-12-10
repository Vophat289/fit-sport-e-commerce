import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService, Product } from '../../../services/product.service';
import { CategoryService, Category } from '../../../services/category.service';
// import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';

import { VariantService } from '../../services/variant.service';
import { PriceRangePipe } from '../price-range.pipe';

@Component({
  selector: 'app-product-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PriceRangePipe],
  templateUrl: './product-admin.component.html',
  styleUrls: ['./product-admin.component.css'],
})
export class ProductAdminComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];

  totalPages: number = 1;

  productForm!: FormGroup;
  isEdit: boolean = false;
  selectedProductId: string | null = null;
  editingIndex: number | null = null;

  // Tách biệt: ảnh cũ (URL) và ảnh mới (File + preview)
  existingImages: string[] = [];        // ảnh từ DB còn giữ
  newFiles: File[] = [];               // file mới được chọn
  newFilePreviews: string[] = [];      // preview base64 cho newFiles

  // deprecated fields removed (selectedFiles / previewImages original)
  searchTerm: string = '';
  isLoading = false;
  showForm = false;
  message: { type: 'success' | 'error'; text: string } | null = null;
  placeholderImage = 'https://via.placeholder.com/100x100?text=No+Image';

  // PHÂN TRANG
  currentPage = 1;
  pageSize = 5;
  pagedProducts: Product[] = [];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router,
    private variantService: VariantService,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.initForm();
  }

  // getter dùng trong HTML để render preview (ảnh cũ + preview ảnh mới)
  get previewImages(): string[] {
    return [...this.existingImages, ...this.newFilePreviews];
  }

  loadProducts() {
  this.productService.getAll().subscribe((res) => {
    this.products = res;

    let count = 0;

    this.products.forEach((p, idx) => {
      p._displayIndex = idx + 1;

      // Gọi API lấy biến thể của sản phẩm
      this.variantService.getVariantsByProduct(p._id!).subscribe(variants => {

        if (!variants || variants.length === 0) {
          p.displayPrice = p.price;
          p.displayColors = [];
          p.displaySizes = [];
        } else {
          const prices = variants.map(v => v.price);
          p.displayPrice = Math.min(...prices);
          p.displayPrices = prices;

          p.displayColors = Array.from(new Set(variants.map(v => v.color_id?.hex_code).filter(c => c)));
          p.displaySizes = Array.from(new Set(variants.map(v => v.size_id?.name).filter(s => s)));
        }

        count++;
        if (count === this.products.length) {
          this.updatePagedProducts();
        }

      });
    });

  });
}


  loadCategories() {
    this.categoryService.getAll().subscribe((res) => {
      this.categories = res;
    });
  }

initForm() {
this.productForm = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(2)]],
  description: [''],
  category: ['', Validators.required],
  images: [null, [Validators.required,]],
});
}

// atLeastOneImageValidator(): ValidatorFn {
//   return (control: AbstractControl): ValidationErrors | null => {
//     if (this.existingImages.length + this.newFiles.length === 0) {
//       return { required: true };
//     }
//     return null;
//   };
// }

  getFilteredProducts(): Product[] {
    if (!this.searchTerm.trim()) {
      return this.products;
    }
    const lower = this.searchTerm.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      (p.description && p.description.toLowerCase().includes(lower))
    );
  }

  updatePagedProducts() {
    const filtered = this.getFilteredProducts();
    this.totalPages = Math.ceil(filtered.length / this.pageSize) || 1;
    this.currentPage = Math.min(this.currentPage, this.totalPages);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.pagedProducts = filtered.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number) {
    if (page < 1) page = 1;
    const totalPages = Math.ceil(this.getFilteredProducts().length / this.pageSize);
    if (page > totalPages) page = totalPages;

    this.currentPage = page;
    this.updatePagedProducts();
  }

  onSearchTermChange() {
    this.currentPage = 1;
    this.updatePagedProducts();
  }

  openCreate() {
    this.isEdit = false;
    this.selectedProductId = null;

    // reset rõ ràng
    this.existingImages = [];
    this.newFiles = [];
    this.newFilePreviews = [];

    this.productForm.reset({
      name: '',
      price: 0,
      description: '',
      category: '',
      colors: '',
      sizes: '',
      images: null
    });

    this.productForm.markAllAsTouched();

    this.showForm = true;
  }

  openEdit(product: Product) {
    this.isEdit = true;
    this.selectedProductId = product._id || null;
    this.editingIndex = this.products.findIndex(p => p._id === product._id);
    if (this.editingIndex === -1) {
  this.editingIndex = 0; // hoặc xử lý khác phù hợp
}

    // ảnh cũ từ DB (URL strings)
    this.existingImages = product.image ? [...product.image] : [];
    // xóa các file mới / preview nếu có
    this.newFiles = [];
    this.newFilePreviews = [];

    this.productForm.patchValue({
      name: product.name,
      price: product.price,
      description: product.description,
      category: typeof product.category === 'string' ? product.category : product.category?._id,
      colors: product.colors?.join(', ') || '',
      sizes: product.sizes?.join(', ') || '',
      images: this.existingImages.length > 0 ? this.existingImages : null,
    });

    this.productForm.markAllAsTouched();

    this.showForm = true;
  }

  // Khi người dùng chọn file
onFileChange(event: any) {
  const files: FileList = event.target.files;
  if (!files || files.length === 0) {
    this.newFiles = [];
    this.newFilePreviews = [];
    this.productForm.get('images')?.setValue(null);
    this.productForm.get('images')?.updateValueAndValidity();
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files.item(i);
    if (!file) continue;
    this.newFiles.push(file);

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.newFilePreviews.push(e.target.result);

      // Cập nhật FormControl images mỗi lần có ảnh mới load xong
      this.productForm.get('images')?.setValue(this.newFiles.length > 0 ? this.newFiles : null);
      this.productForm.get('images')?.updateValueAndValidity();
    };
    reader.readAsDataURL(file);
  }

  // Reset input để có thể chọn lại file giống cũ
  event.target.value = '';
}


submit() {
  if (this.productForm.invalid) {
    this.productForm.markAllAsTouched();
    return;
  }

  this.isLoading = true;

  const formData = new FormData();
  const values = this.productForm.value;
 
  formData.append('name', values.name);
  formData.append('description', values.description || '');
  formData.append('category', values.category);

  formData.append('existingImages', JSON.stringify(this.existingImages));
  this.newFiles.forEach((file) => formData.append('images', file));

  const request$ = this.isEdit
    ? this.productService.updateProduct(this.selectedProductId!, formData)
    : this.productService.createProduct(formData);

  request$.subscribe({
    next: (res: any) => {
      this.isLoading = false;

      const newProduct = res.product || res.data || res;

      const originalIndex = this.editingIndex !== undefined ? this.editingIndex : 0;

      if (this.isEdit) {
        // xóa bản cũ
        this.products = this.products.filter(p => p._id !== newProduct._id);
      }

      (newProduct as any)._displayIndex = originalIndex;

      // thêm bản mới lên đầu
      this.products.unshift(newProduct);

      // cập nhật phân trang ngay (không cần loadProducts)
      this.updatePagedProducts();

      alert(this.isEdit ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!');

      this.showForm = false;
      this.productForm.reset();
      this.existingImages = [];
      this.newFiles = [];
      this.newFilePreviews = [];
      this.loadProducts();
    },

    error: () => {
      this.isLoading = false;
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  });
}

  delete(productId: string) {
    if (confirm('Bạn có chắc muốn xóa sản phẩm?')) {
      this.productService.deleteProduct(productId).subscribe(() => {
        this.loadProducts();
        alert('Đã xóa sản phẩm!');
      });
    }
  }

  onImageError(event: any) {
    event.target.src = this.placeholderImage;
  }

  getCategoryName(categoryIdOrObj: any): string {
    if (!categoryIdOrObj) return '';
    if (typeof categoryIdOrObj === 'string') {
      const cat = this.categories.find(c => c._id === categoryIdOrObj);
      return cat ? cat.name : '';
    } else if (categoryIdOrObj.name) {
      return categoryIdOrObj.name;
    }
    return '';
  }

  // Xóa ảnh theo index hiển thị (index tham chiếu tới previewImages = existingImages + newFilePreviews)
removeImage(index: number) {
  if (index < this.existingImages.length) {
    this.existingImages.splice(index, 1);
  } else {
    const newIndex = index - this.existingImages.length;
    this.newFiles.splice(newIndex, 1);
    this.newFilePreviews.splice(newIndex, 1);
  }

  // Cập nhật FormControl images dựa trên tổng ảnh còn lại
  if (this.existingImages.length + this.newFiles.length === 0) {
    this.productForm.get('images')?.setValue(null);
  } else {
    this.productForm.get('images')?.setValue(this.newFiles.length > 0 ? this.newFiles : this.existingImages);
  }
  this.productForm.get('images')?.updateValueAndValidity();
}
goToVariantAdmin(productId: string, productName: string): void {
  this.router.navigate(['/admin/variant-admin', productId]);
}

}
