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
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {

  // ✅ Tự động chọn API theo môi trường (local / deploy)
  private readonly API_URL =
    window.location.hostname === 'localhost'
      ? 'http://localhost:3000/api/admin/news'
      : 'https://fitsport.io.vn/api/admin/news';

  // ==== CLOUDINARY CONFIG ====
  private readonly CLOUDINARY_CLOUD_NAME = 'dolqwcawp';
  private readonly CLOUDINARY_BASE_URL =
    `https://res.cloudinary.com/${this.CLOUDINARY_CLOUD_NAME}/image/upload/`;
  private readonly placeholderImage = 'assets/no-image.png';
  // ============================

  constructor(private http: HttpClient) {}

  // 🔹 Danh sách public cho trang /news
  getPublicNews(page: number = 1): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/public?page=${page}`);
  }

  // 🔹 Tin mới nhất cho trang chủ
  getLatestNews(limit: number = 6): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/latest?limit=${limit}`);
  }

  // 🔹 Chi tiết bài viết theo slug – KHỚP BACKEND:
  // router.get('/detail/:slug', getNewsDetailBySlug);
  getNewsBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/detail/${slug}`);
  }

  // ==== Hiển thị ảnh ====
  getThumbnailUrl(thumbnail?: string): string {
    if (!thumbnail) return this.placeholderImage;

    // FIX tất cả trường hợp localhost -> domain thật
    thumbnail = thumbnail
      .replace('http://localhost:3000', 'https://fitsport.io.vn')
      .replace('https://localhost:3000', 'https://fitsport.io.vn')
      .replace('http://127.0.0.1:3000', 'https://fitsport.io.vn');

    // Nếu đã là URL đầy đủ -> dùng luôn
    if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) {
      return thumbnail;
    }

    // Ngược lại: build URL Cloudinary với transform
    const transformation = 'w_800,h_450,c_fill/';
    return `${this.CLOUDINARY_BASE_URL}${transformation}${thumbnail}`;
  }
}
