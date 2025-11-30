// src/app/admin/pages/news-admin/news-admin.component.ts
import { Component, OnInit } from '@angular/core';
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
  tags?: string[] | string;  // Cho phép cả string (khi từ DB)
  createdAt?: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-news-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './news-admin.component.html',
  styleUrl: './news-admin.component.css'
})
export class NewsAdminComponent implements OnInit {
  newsList: News[] = [];
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
  isEdit = false;
  isLoading = false;
  message: { type: 'success' | 'error'; text: string } | null = null;

  private readonly apiUrl = 'http://localhost:3000/api/admin/news';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadNews();
  }

  /** Tải danh sách bài viết */
  loadNews() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}?limit=1000`).subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          this.newsList = res;
        } else if (res?.data) {
          this.newsList = Array.isArray(res.data) ? res.data : Object.values(res.data);
        } else {
          this.newsList = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi tải tin tức:', err);
        this.newsList = [];
        this.isLoading = false;
        this.showMessage('error', 'Không thể tải danh sách bài viết');
      }
    });
  }

  /** Chọn ảnh */
  onFileSelected(event: any) {
    const file = event.target.files[0] as File;
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
    }
  }

  /** Lưu (thêm hoặc sửa) */
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

    // XỬ LÝ TAGS AN TOÀN 100% - KHÔNG BAO GIỜ LỖI .join nữa
    const tagsArray = Array.isArray(this.form.tags)
      ? this.form.tags
      : typeof this.form.tags === 'string'
        ? this.form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

    if (tagsArray.length > 0) {
      formData.append('tags', tagsArray.join(','));
    }

    if (this.selectedFile) {
      formData.append('thumbnail', this.selectedFile);
    }

    this.isLoading = true;

    const request$ = this.isEdit && this.form.slug
      ? this.http.put(`${this.apiUrl}/slug/${this.form.slug}`, formData)
      : this.http.post(this.apiUrl, formData);

    request$.subscribe({
      next: () => {
        this.showMessage('success', this.isEdit ? 'Cập nhật bài viết thành công!' : 'Đăng bài thành công!');
        this.resetForm();
        this.loadNews();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi lưu bài viết:', err);
        this.showMessage('error', 'Có lỗi xảy ra, vui lòng thử lại!');
        this.isLoading = false;
      }
    });
  }

  /** Sửa bài viết - FIX LỖI TAGS */
  edit(item: News) {
    this.form = {
      ...item,
      // Đảm bảo tags luôn là mảng string[]
      tags: Array.isArray(item.tags)
        ? item.tags
        : typeof item.tags === 'string'
          ? item.tags.split(',').map(t => t.trim()).filter(Boolean)
          : []
    };
    this.isEdit = true;
    this.selectedFile = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Ẩn / Bỏ ẩn bài viết - GỬI ĐÚNG isActive */
  toggleHide(id: string, isActive: boolean) {
    const action = isActive ? 'Ẩn' : 'Bỏ ẩn';
    if (!confirm(`${action} bài viết này?`)) {
      return;
    }

    this.isLoading = true;
    this.http.patch(`${this.apiUrl}/${id}/toggle-hide`, { isActive: !isActive }).subscribe({
      next: () => {
        this.showMessage('success', isActive ? 'Đã ẩn bài viết' : 'Đã bỏ ẩn bài viết');
        this.loadNews();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi ẩn/hiện bài viết:', err);
        this.showMessage('error', 'Thao tác thất bại');
        this.isLoading = false;
      }
    });
  }

  /** Reset form */
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
    this.isEdit = false;
  }

  /** Hiển thị thông báo */
  showMessage(type: 'success' | 'error', text: string) {
    this.message = { type, text };
    setTimeout(() => this.message = null, 4000);
  }
}