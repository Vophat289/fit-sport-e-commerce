import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService, Product } from '../../../services/product.service';
import { CategoryService, Category } from '../../../services/category.service';

@Component({
  selector: 'app-product-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './product-admin.component.html',
  styleUrls: ['./product-admin.component.css'],
})
export class ProductAdminComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];

  totalPages: number =1

  productForm!: FormGroup;
  isEdit: boolean = false;
  selectedProductId: string | null = null;

  previewImages: string[] = [];
  selectedFiles: File[] = [];

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
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.initForm();
  }

  loadProducts() {
    this.productService.getAll().subscribe((res) => {
      this.products = res;
      this.currentPage = 1;
      this.updatePagedProducts();
    });
  }

  loadCategories() {
    this.categoryService.getAll().subscribe((res) => {
      this.categories = res;
    });
  }

  initForm() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      description: [''],
      category: ['', Validators.required],
      colors: [''],
      sizes: [''],
      images: [null],
    });
  }

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
    this.previewImages = [];
    this.selectedFiles = [];
    this.productForm.reset();
    this.showForm = true;
  }

  openEdit(product: Product) {
    this.isEdit = true;
    this.selectedProductId = product._id || null;

    this.previewImages = product.image || [];
    this.selectedFiles = [];

    this.productForm.patchValue({
      name: product.name,
      price: product.price,
      description: product.description,
      category: typeof product.category === 'string' ? product.category : product.category?._id,
      colors: product.colors?.join(', ') || '',
      sizes: product.sizes?.join(', ') || '',
    });
    this.showForm = true;
  }

  onFileChange(event: any) {
    const files = event.target.files;
    this.selectedFiles = Array.from(files);

    this.previewImages = [];
    for (let file of this.selectedFiles) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.previewImages.push(e.target.result);
      reader.readAsDataURL(file);
    }
  }

  submit() {
    if (this.productForm.invalid) return;
    this.isLoading = true;

    const formData = new FormData();
    const values = this.productForm.value;
    formData.append('name', values.name);
    formData.append('price', values.price.toString());
    formData.append('description', values.description || '');
    formData.append('category', values.category);

    formData.append('colors', JSON.stringify(values.colors.split(',').map((c: string) => c.trim())));
    formData.append('sizes', JSON.stringify(values.sizes.split(',').map((s: string) => s.trim())));

    this.selectedFiles.forEach((file) => formData.append('images', file));

    const request$ = this.isEdit
      ? this.productService.updateProduct(this.selectedProductId!, formData)
      : this.productService.createProduct(formData);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.loadProducts();
        alert(this.isEdit ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!');
        this.openCreate(); // reset form
        this.showForm = false;
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
}


