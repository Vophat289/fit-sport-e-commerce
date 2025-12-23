import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, Category } from '@app/services/category.service';
import { NotificationService } from '@app/services/notification.service';

@Component({
  selector: 'app-category-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-admin.component.html',
  styleUrls: ['./category-admin.component.css'],
})
export class CategoryAdminComponent implements OnInit {
  categories: Category[] = []; //ds tất cả categories
  editCategory: Category | null = null;
  //form data cho create và edit
  categoryForm: Partial<Category> = {
    name: '',
    description: '',
    image: '',
  };
  showForm: boolean = false;
  isLoading: boolean = false; //loading state
  searchTerm: string = ''; //từ khóa tìm kiếm

  //tb lỗi hay ok
  message: { type: 'success' | 'error'; text: string } | null = null;
  readonly placeholderImage =
    "data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='120' height='120' rx='16' ry='16' fill='%231e293b'/%3E%3Cpath d='M24 84l16-20 20 24 12-14 24 30H24z' fill='%2338bdf8' opacity='0.4'/%3E%3Ccircle cx='42' cy='44' r='12' fill='%2394a3b8' opacity='0.6'/%3E%3C/svg%3E";

  constructor(
    private categoryService: CategoryService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  //hàm tải danh mục
  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getAll().subscribe({
      next: (data) => {
        this.categories = data;
        this.isLoading = false;
      },
      error: () => {
        this.showMessage('error', 'lỗi khi tải danh mục');
        this.isLoading = false;
      },
    });
  }

  //hàm tạo form create
  createAdminForm(): void {
    this.editCategory = null;
    this.categoryForm = { name: '', description: '', image: '' };
    this.showForm = true;
  }

  //hàm tạo form update
  updateAdminForm(category: Category): void {
    this.editCategory = category;
    this.categoryForm = {
      name: category.name,
      description: category.description || '',
      image: category.image || '',
    };
    this.showForm = true;
  }

  //hàm submit form
  submitForm(): void {
    if (!this.categoryForm.name?.trim()) {
      this.showMessage('error', 'Tên danh mục không được để trống');
      return;
    }

    if (this.editCategory && !this.editCategory._id) {
      this.showMessage('error', 'Không tìm thấy danh mục để update');
      return;
    }

    this.isLoading = true;

    if (this.editCategory) {
      this.categoryService
        .update(this.editCategory._id!, this.categoryForm)
        .subscribe({
          next: () => this.handleSuccess('Cập nhật thành công'),
          error: () => this.handleError('Có lỗi khi cập nhật'),
        });
    } else {
      this.categoryService.create(this.categoryForm).subscribe({
        next: () => this.handleSuccess('Thêm danh mục thành công'),
        error: () => this.handleError('Lỗi khi thêm danh mục'),
      });
    }
  }

  //xóa danh mục
  deleteAdminForm(id: string): void {
    this.notification.confirmDelete('danh mục này').then((confirmed) => {
      if (!confirmed) return;

      this.isLoading = true;
      this.categoryService.delete(id).subscribe({
        next: () => {
          this.notification.success('Xóa danh mục thành công');
          this.loadCategories();
        },
        error: () => {
          this.notification.error('Xóa danh mục không thành công');
          this.isLoading = false;
        },
      });
    });
  }

  //hàm xử lý thành công
  private handleSuccess(message: string): void {
    this.showMessage('success', message);
    this.isLoading = false;
    this.loadCategories();
  }

  //hàm xử lý lỗi
  private handleError(message: string): void {
    this.showMessage('error', message);
    this.isLoading = false;
  }

  getFilteredCategories(): Category[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.categories;
    }

    return this.categories.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        category.description?.toLowerCase().includes(term),
    );
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.placeholderImage;
  }

  //hàm hiển thị thông báo
  private showMessage(type: 'success' | 'error', text: string): void {
    this.message = { type, text };
    setTimeout(() => (this.message = null), 3000);
  }
}
