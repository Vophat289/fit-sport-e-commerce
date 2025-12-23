// src/app/admin/pages/news-admin/news-admin.component.ts
import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NewsService, News } from '../../../services/news.service';
import { NotificationService } from '../../../services/notification.service';

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
  previewImageUrl: string | null = null;
  isEdit = false;
  isLoading = false;
  message: { type: 'success' | 'error'; text: string } | null = null;

  isModalOpen: boolean = false;

  private readonly apiUrl = `${window.location.origin}/api/admin/news`;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private newsService: NewsService,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadNews();
  }

  // ==================== HELPERS ====================
  private normalizeTags(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .map((t) => String(t).trim())
        .filter((t) => !!t);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean);
    }

    return [];
  }

  /**
   * Lấy tags từ form (có thể bị TS suy ra never), normalize lại
   */
  private getFormTags(): string[] {
    const tagsValue = (this.form as any).tags as unknown;
    return this.normalizeTags(tagsValue);
  }

  getThumbnailUrl(thumbnail?: string): string {
    return this.newsService.getThumbnailUrl(thumbnail);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement | null;
    if (img) img.src = 'assets/no-image.png';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;
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
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.previewImageUrl = (e.target?.result as string) || null;
      // nếu bạn dùng OnPush thì bật dòng dưới
      // this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  private resetFileInput() {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // ==================== LOAD ====================
  loadNews() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}?limit=1000`).subscribe({
      next: (res) => {
        const rawList: News[] = Array.isArray(res) ? res : (res?.data || []);
        this.newsList = rawList.map((item: any) => ({
          ...item,
          displayThumbnail: this.newsService.getThumbnailUrl(item.thumbnail)
        }));
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi tải tin tức:', err);
        this.newsList = [];
        this.displayedNewsList = [];
        this.isLoading = false;
        this.showMessage('error', 'Không thể tải danh sách bài viết');
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
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.displayedNewsList = [...this.newsList];
      return;
    }

    this.displayedNewsList = this.newsList.filter((item) =>
      (item.title || '').toLowerCase().includes(term)
    );
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
    formData.append('title', this.form.title!.trim());
    formData.append('content', this.form.content!.trim());

    if (this.form.short_desc?.trim()) formData.append('short_desc', this.form.short_desc.trim());
    if (this.form.author?.trim()) formData.append('author', this.form.author.trim());

    const tagsArray = this.getFormTags();
    if (tagsArray.length > 0) formData.append('tags', tagsArray.join(','));

    if (this.selectedFile) formData.append('thumbnail', this.selectedFile);

    this.isLoading = true;

    const slug = (this.form as any).slug as string | undefined;
    const request$ = this.isEdit && slug
      ? this.http.put(`${this.apiUrl}/slug/${slug}`, formData)
      : this.http.post(this.apiUrl, formData);

    request$.subscribe({
      next: () => {
        this.showMessage('success', this.isEdit ? 'Cập nhật thành công!' : 'Đăng bài thành công!');
        this.resetForm();
        this.closeModal();
        this.loadNews();
      },
      error: (err) => {
        console.error(err);
        this.showMessage('error', 'Có lỗi xảy ra, vui lòng thử lại!');
        this.isLoading = false;
      }
    });
  }

  // ==================== EDIT ====================
  edit(item: News) {
    const itemAny = item as any;

    this.form = {
      ...itemAny,
      tags: this.normalizeTags(itemAny.tags)
    };

    this.isEdit = true;
    this.selectedFile = null;
    this.previewImageUrl = null;

    this.openModal();
    // this.cdr.detectChanges();
  }

  // ==================== POPUP ====================
  openCreateModal(): void {
    this.isEdit = false;
    this.resetForm();
    this.isModalOpen = true;
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  // ==================== IMAGE ====================
  removeSelectedImage() {
    this.selectedFile = null;
    this.previewImageUrl = null;
    this.resetFileInput();
    // this.cdr.detectChanges();
  }

  // ==================== TOGGLE HIDE ====================
  toggleHide(id: string, currentIsActive: boolean) {
    this.notification.confirm(
      `${currentIsActive ? 'Ẩn' : 'Bỏ ẩn'} bài viết này?`,
      'Xác nhận',
      currentIsActive ? 'Ẩn' : 'Bỏ ẩn',
      'Hủy'
    ).then((confirmed) => {
      if (!confirmed) return;

      this.isLoading = true;
      this.http.patch(`${this.apiUrl}/${id}/toggle-hide`, {}).subscribe({
        next: () => {
          this.notification.success(currentIsActive ? 'Đã ẩn bài viết' : 'Đã bỏ ẩn bài viết');
          this.loadNews();
        },
        error: (err) => {
          console.error(err);
          this.notification.error('Không thể thay đổi trạng thái');
          this.isLoading = false;
        }
      });
    });
  }

  // ==================== RESET FORM ====================
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
    // this.cdr.detectChanges();
  }

  // ==================== MESSAGE ====================
  showMessage(type: 'success' | 'error', text: string) {
    this.message = { type, text };
    setTimeout(() => (this.message = null), 4000);
  }
}
