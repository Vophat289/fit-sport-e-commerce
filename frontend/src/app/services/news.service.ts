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

  // dùng cho FE: URL đã tính sẵn
  displayThumbnail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {


  private readonly API_URL = '/api/admin/news';

  // ==== CLOUDINARY CONFIG ====
  private readonly CLOUDINARY_CLOUD_NAME = 'dolqwcawp';
  private readonly CLOUDINARY_BASE_URL =
    `https://res.cloudinary.com/${this.CLOUDINARY_CLOUD_NAME}/image/upload/`;
  private readonly placeholderImage = 'assets/no-image.png';
  private readonly PROD_DOMAIN = 'https://fitsport.io.vn';
  // ============================

  constructor(private http: HttpClient) {}

  // ==================  API PUBLIC ==================

  // Danh sách public cho trang /news (phân trang)
  getPublicNews(page: number = 1): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/public?page=${page}`);
  }

  // Tin mới nhất cho trang chủ
  getLatestNews(limit: number = 6): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/latest?limit=${limit}`);
  }

  // Chi tiết bài viết theo slug –
  getNewsBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/detail/${slug}`);
  }

  // ==================  CLOUDINARY HELPER ==================

  getThumbnailUrl(thumbnail?: string): string {
    if (!thumbnail) return this.placeholderImage;

    thumbnail = thumbnail
      .replace('http://localhost:3000', this.PROD_DOMAIN)
      .replace('https://localhost:3000', this.PROD_DOMAIN)
      .replace('http://127.0.0.1:3000', this.PROD_DOMAIN);

    if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) {
      return thumbnail;
    }

    const transformation = 'w_800,h_450,c_fill/';
    return `${this.CLOUDINARY_BASE_URL}${transformation}${thumbnail}`;
  }
}
