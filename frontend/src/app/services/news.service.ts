// src/app/services/news.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface News {
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
  displayThumbnail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {

  // ĐÃ SỬA: Dùng luôn origin hiện tại → không bao giờ bị www / non-www nữa!
  private readonly API_URL = `${window.location.origin}/api/admin/news`;

  // Cloudinary config
  private readonly CLOUDINARY_CLOUD_NAME = 'dolqwcawp';
  private readonly CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${this.CLOUDINARY_CLOUD_NAME}/image/upload/`;
  private readonly placeholderImage = 'assets/no-image.png';

  constructor(private http: HttpClient) {}

  // ================== PUBLIC API ==================
  getPublicNews(page: number = 1): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/public?page=${page}`);
  }

  getLatestNews(limit: number = 6): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/latest?limit=${limit}`);
  }

  getNewsBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/detail/${slug}`);
  }

  // ================== HELPER CHO ẢNH ==================
  getThumbnailUrl(thumbnail?: string): string {
    if (!thumbnail) return this.placeholderImage;

    // Fix localhost còn sót trong DB (nếu có)
    thumbnail = thumbnail
      .replace('http://localhost:3000', '')
      .replace('https://localhost:3000', '')
      .replace('http://127.0.0.1:3000', '')
      .trim();

    // Nếu đã là URL đầy đủ → trả luôn
    if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) {
      return thumbnail;
    }

    // Cloudinary public_id → tối ưu cực mạnh
    const transformation = 'f_auto,q_auto,w_400,h_400,c_fill,g_auto/';
    return `${this.CLOUDINARY_BASE_URL}${transformation}${thumbnail}`;
  }
}