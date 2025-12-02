// src/app/services/news.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';

export interface News {
  _id?: string;
  title: string;
  slug: string;
  content: string;
  short_desc?: string;
  thumbnail?: string;
  author?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export type CreateNewsData = Omit<
  News,
  '_id' | 'slug' | 'createdAt' | 'updatedAt'
> & {
  tags?: string[] | string;
};

export type UpdateNewsData = Partial<CreateNewsData>;

@Injectable({
  providedIn: 'root'
})
export class NewsService {

  private readonly API_URL = 'http://localhost:3000/api/admin/news';
  private readonly BASE_URL = 'http://localhost:3000'; 
  private readonly PLACEHOLDER = 'https://via.placeholder.com/400x250/dc2626/white?text=FITSPORT';

  // Subject để thông báo khi có tin mới
  private newsUpdated = new Subject<void>();
  newsUpdated$ = this.newsUpdated.asObservable();


  constructor(private http: HttpClient) {}

  // ====================== PUBLIC ======================
  getPublicNews(page: number = 1): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/public?page=${page}`);
  }

  getLatestNews(limit: number = 6): Observable<News[]> {
    return this.http.get<News[]>(`${this.API_URL}/latest?limit=${limit}`);
  }

  getNewsBySlug(slug: string): Observable<News> {
    return this.http.get<News>(`${this.API_URL}/detail/${slug}`);
  }

  // ====================== ADMIN ======================
  getAllNewsAdmin(): Observable<News[]> {
    return this.http.get<News[]>(`${this.API_URL}`);
  }

  createNews(data: CreateNewsData, file?: File): Observable<News> {
    const formData = new FormData();
    
    // Xử lý các trường text
    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.short_desc) formData.append('short_desc', data.short_desc);
    formData.append('author', data.author || 'Admin');

    if (data.tags) {
      const tagsString = Array.isArray(data.tags) ? data.tags.join(',') : data.tags;
      formData.append('tags', tagsString);
    }

    // Xử lý file ảnh
    if (file) {
      // Đảm bảo tên file an toàn
      const safeFileName = this.sanitizeFileName(file.name);
      formData.append('thumbnail', file, safeFileName);
    }

    return this.http.post<News>(this.API_URL, formData).pipe(
      tap((newNews) => {
        console.log('News created:', newNews);
        // Thông báo tin đã được tạo
        this.newsUpdated.next();
      })
    );
  }

  updateNewsBySlug(slug: string, data: UpdateNewsData, file?: File): Observable<News> {
    const formData = new FormData();
    
    // Xử lý các trường text
    if (data.title !== undefined) formData.append('title', data.title);
    if (data.content !== undefined) formData.append('content', data.content);
    if (data.short_desc !== undefined) formData.append('short_desc', data.short_desc);
    if (data.author !== undefined) formData.append('author', data.author);

    if (data.tags) {
      const tagsString = Array.isArray(data.tags) ? data.tags.join(',') : data.tags;
      formData.append('tags', tagsString);
    }

    // Xử lý file ảnh
    if (file) {
      const safeFileName = this.sanitizeFileName(file.name);
      formData.append('thumbnail', file, safeFileName);
    }

    return this.http.put<News>(`${this.API_URL}/slug/${slug}`, formData).pipe(
      tap((updatedNews) => {
        console.log('News updated:', updatedNews);
        // Thông báo tin đã được cập nhật
        this.newsUpdated.next();
      })
    );
  }

  deleteNews(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        console.log('News deleted:', id);
        // Thông báo tin đã xóa
        this.newsUpdated.next();
      })
    );
  }

  toggleNewsStatus(id: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}/toggle-hide`, {}).pipe(
      tap(() => {
        console.log('News status toggled:', id);
        // Thông báo trạng thái đã thay đổi
        this.newsUpdated.next();
      })
    );
  }

  // ====================== HÀM HIỂN THỊ ẢNH ======================
  getThumbnailUrl(thumbnail?: string): string {
    if (!thumbnail) return this.PLACEHOLDER;
    
    // Nếu đã là URL đầy đủ
    if (thumbnail.startsWith('http')) return thumbnail;
    
    // Xử lý đặc biệt cho các loại đường dẫn
    if (thumbnail.includes('://')) {
      return thumbnail; 
    }
    
    // Nếu đường dẫn bắt đầu bằng uploads/
    if (thumbnail.includes('uploads/')) {
      const cleanPath = thumbnail.startsWith('/') ? thumbnail.substring(1) : thumbnail;
      return `${this.BASE_URL}/${cleanPath}`;
    }
    
    // Nếu chỉ là tên file, thêm vào thư mục uploads
    if (!thumbnail.includes('/') && !thumbnail.startsWith('/')) {
      return `${this.BASE_URL}/uploads/${thumbnail}`;
    }
    
    // Mặc định: thêm base URL
    return `${this.BASE_URL}${thumbnail.startsWith('/') ? '' : '/'}${thumbnail}`;
  }

  // Hàm để manual trigger reload
  triggerReload(): void {
    this.newsUpdated.next();
  }

  // Hàm upload ảnh riêng (nếu cần)
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    const safeFileName = this.sanitizeFileName(file.name);
    formData.append('image', file, safeFileName);
    
    return this.http.post(`${this.API_URL}/upload`, formData);
  }

  // Hàm sanitize tên file
  private sanitizeFileName(fileName: string): string {
    // Loại bỏ ký tự đặc biệt giữ 
    return fileName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') 
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9.\-]/g, '_') 
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .trim();
  }

  // Debug: Kiểm tra URL
  debugThumbnail(thumbnail?: string): void {
    console.log('=== DEBUG THUMBNAIL ===');
    console.log('Input:', thumbnail);
    console.log('Output:', this.getThumbnailUrl(thumbnail));
    console.log('BASE_URL:', this.BASE_URL);
    console.log('=======================');
  }
}