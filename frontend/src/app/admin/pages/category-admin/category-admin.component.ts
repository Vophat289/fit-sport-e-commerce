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
  };
  selectedFile: File | null = null; // File ảnh được chọn
  imagePreview: string | null = null; // Preview ảnh
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
    this.categoryForm = { name: '', description: '' };
    this.selectedFile = null;
    this.imagePreview = null;
    this.showForm = true;
  }

  //hàm tạo form update
  updateAdminForm(category: Category): void {
    this.editCategory = category;
    this.categoryForm = {
      name: category.name,
      description: category.description || '',
    };
    this.selectedFile = null;
    this.imagePreview = category.image || null;
    this.showForm = true;
  }

  //hàm xử lý khi chọn file
  onFileChange(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      // Kiểm tra loại file - chỉ chấp nhận JPG và PNG
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        this.showMessage('error', 'Chỉ chấp nhận file JPG và PNG');
        // Reset file input
        event.target.value = '';
        return;
      }
      
      // Kiểm tra kích thước file (tối đa 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showMessage('error', 'Kích thước file không được vượt quá 5MB');
        // Reset file input
        event.target.value = '';
        return;
      }

      this.selectedFile = file;
      
      // Tạo preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target?.result || null;
      };
      reader.readAsDataURL(file);
    }
  }

  //hàm xóa ảnh đã chọn
  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = this.editCategory?.image || null;
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  //hàm submit form
  submitForm(): void {
    if (!this.categoryForm.name?.trim()) {
      this.showMessage('error', 'Tên danh mục không được để trống');
      return;
    }

    // Kiểm tra bắt buộc phải có file ảnh khi tạo mới
    if (!this.editCategory && !this.selectedFile) {
      this.showMessage('error', 'Vui lòng chọn ảnh danh mục');
      return;
    }

    // Khi sửa, nếu không chọn file mới thì giữ ảnh cũ
    if (this.editCategory && !this.selectedFile && !this.editCategory.image) {
      this.showMessage('error', 'Vui lòng chọn ảnh danh mục');
      return;
    }

    if (this.editCategory && !this.editCategory._id) {
      this.showMessage('error', 'Không tìm thấy danh mục để update');
      return;
    }

    this.isLoading = true;

    // Luôn gửi FormData khi có file, hoặc khi tạo mới (bắt buộc có file)
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('name', this.categoryForm.name!.trim());
      formData.append('description', this.categoryForm.description || '');
      formData.append('image', this.selectedFile);

      if (this.editCategory) {
        this.categoryService
          .updateWithFile(this.editCategory._id!, formData)
          .subscribe({
            next: () => this.handleSuccess('Cập nhật thành công'),
            error: () => this.handleError('Có lỗi khi cập nhật'),
          });
      } else {
        this.categoryService.createWithFile(formData).subscribe({
          next: () => this.handleSuccess('Thêm danh mục thành công'),
          error: () => this.handleError('Lỗi khi thêm danh mục'),
        });
      }
    } else {
      // Trường hợp sửa nhưng không chọn file mới - giữ ảnh cũ
      // Không cần gửi gì về ảnh, backend sẽ giữ nguyên
      const formData = new FormData();
      formData.append('name', this.categoryForm.name!.trim());
      formData.append('description', this.categoryForm.description || '');

      this.categoryService
        .updateWithFile(this.editCategory!._id!, formData)
        .subscribe({
          next: () => this.handleSuccess('Cập nhật thành công'),
          error: () => this.handleError('Có lỗi khi cập nhật'),
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
    this.selectedFile = null;
    this.imagePreview = null;
    this.showForm = false;
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
