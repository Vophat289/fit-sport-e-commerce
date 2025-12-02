// src/app/admin/pages/news-admin/news-admin.component.ts
import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface News {
  _id?: string;
  title: string;
  slug: string;
  short_desc?: string;
  content: string;
  thumbnail?: string;
  author?: string;
  tags?: string[] | string;
  createdAt?: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-news-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './news-admin.component.html',
  styleUrls: ['./news-admin.component.css'] 
})
export class NewsAdminComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  newsList: News[] = [];
  displayedNewsList: News[] = [];
  searchTerm: string = '';

  form: Partial<News> = {
    title: '',
    content: '',
    short_desc: '',
    slug: '',
    author: 'Admin',
    tags: [],
    isActive: true
  };

  selectedFile: File | null = null;
  previewImageUrl: string | null = null; // thêm để template preview ảnh không lỗi
  isEdit = false;
  isLoading = false;
  message: { type: 'success' | 'error'; text: string } | null = null;

  private readonly apiUrl = 'http://localhost:3000/api/admin/news';
  private readonly baseUrl = 'http://localhost:3000';
  private readonly placeholderImage = 'https://via.placeholder.com/120x120.png?text=No+Image';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNews();
  }

  // ==================== HÀM XỬ LÝ ẢNH ====================
  getThumbnailUrl(thumbnail?: string): string {
    if (!thumbnail) return this.placeholderImage;

    if (thumbnail.startsWith('http')) return thumbnail;

    const cleanPath = thumbnail.startsWith('/') ? thumbnail : `/${thumbnail}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  onImageError(event: any) {
    event.target.src = this.placeholderImage;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0] as File;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showMessage('error', 'Vui lòng chọn file ảnh hợp lệ');
      this.resetFileInput();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showMessage('error', 'Ảnh không được vượt quá 5MB');
      this.resetFileInput();
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewImageUrl = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  private resetFileInput() {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // ==================== LOAD NEWS ====================
  loadNews() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}?limit=1000`).subscribe({
      next: (res) => {
        this.newsList = Array.isArray(res) ? res : (res?.data || []);
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tải tin tức:', err);
        this.newsList = [];
        this.displayedNewsList = [];
        this.isLoading = false;
        this.showMessage('error', 'Không thể tải danh sách bài viết');
        this.cdr.detectChanges();
      }
    });
  }

  // ==================== FILTER ====================
  onSearch() {
    this.applyFilter();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
    this.searchInput?.nativeElement.focus();
  }

  private applyFilter() {
    if (!this.searchTerm.trim()) {
      this.displayedNewsList = [...this.newsList];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.displayedNewsList = this.newsList.filter(item =>
        item.title.toLowerCase().includes(term)
      );
    }
  }

  getDisplayedCount(): number {
    return this.displayedNewsList.length;
  }

  // ==================== SAVE ====================
  save() {
    if (!this.form.title?.trim() || !this.form.content?.trim()) {
      this.showMessage('error', 'Vui lòng nhập tiêu đề và nội dung bài viết');
      return;
    }

    const formData = new FormData();
    formData.append('title', this.form.title.trim());
    formData.append('content', this.form.content.trim());
    if (this.form.short_desc?.trim()) formData.append('short_desc', this.form.short_desc.trim());
    if (this.form.author?.trim()) formData.append('author', this.form.author.trim());

    const tagsArray = Array.isArray(this.form.tags)
      ? this.form.tags
      : typeof this.form.tags === 'string'
        ? this.form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

    if (tagsArray.length > 0) formData.append('tags', tagsArray.join(','));

    if (this.selectedFile) formData.append('thumbnail', this.selectedFile);

    this.isLoading = true;

    const request$ = this.isEdit && this.form.slug
      ? this.http.put(`${this.apiUrl}/slug/${this.form.slug}`, formData)
      : this.http.post(this.apiUrl, formData);

    request$.subscribe({
      next: () => {
        this.showMessage('success', this.isEdit ? 'Cập nhật bài viết thành công!' : 'Đăng bài thành công!');
        this.resetForm();
        this.loadNews();
      },
      error: (err) => {
        console.error('Lỗi lưu bài viết:', err);
        this.showMessage('error', 'Có lỗi xảy ra, vui lòng thử lại!');
        this.isLoading = false;
      }
    });
  }

  edit(item: News) {
    this.form = {
      ...item,
      tags: Array.isArray(item.tags)
        ? item.tags
        : typeof item.tags === 'string'
          ? item.tags.split(',').map(t => t.trim()).filter(Boolean)
          : []
    };
    this.isEdit = true;
    this.selectedFile = null;
    this.previewImageUrl = item.thumbnail ? this.getThumbnailUrl(item.thumbnail) : null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cdr.detectChanges();
  }

  removeSelectedImage() {
    this.selectedFile = null;
    this.previewImageUrl = null;
    this.resetFileInput();
    if (this.isEdit && this.form.thumbnail) {
      this.previewImageUrl = this.getThumbnailUrl(this.form.thumbnail);
    }
    this.cdr.detectChanges();
  }

  toggleHide(id: string, currentIsActive: boolean) {
    if (!confirm(`${currentIsActive ? 'Ẩn' : 'Bỏ ẩn'} bài viết này?`)) return;

    this.isLoading = true;
    this.http.patch(`${this.apiUrl}/${id}/toggle-hide`, {}).subscribe({
      next: () => {
        this.showMessage('success', currentIsActive ? 'Đã ẩn bài viết' : 'Đã bỏ ẩn bài viết');
        this.loadNews();
      },
      error: () => {
        this.showMessage('error', 'Không thể thay đổi trạng thái');
        this.isLoading = false;
      }
    });
  }

  resetForm() {
    this.form = {
      title: '',
      content: '',
      short_desc: '',
      slug: '',
      author: 'Admin',
      tags: [],
      isActive: true
    };
    this.selectedFile = null;
    this.previewImageUrl = null;
    this.isEdit = false;
    this.resetFileInput();
    this.cdr.detectChanges();
  }

  showMessage(type: 'success' | 'error', text: string) {
    this.message = { type, text };
    setTimeout(() => {
      this.message = null;
      this.cdr.detectChanges();
    }, 4000);
  }
}
