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

  private readonly apiUrl = 'https://fitsport.io.vn/api/admin/news';

  // ==== CLOUDINARY CONFIG ====
  private readonly CLOUDINARY_CLOUD_NAME = 'dolqwcawp';
  private readonly CLOUDINARY_BASE_URL =
    `https://res.cloudinary.com/${this.CLOUDINARY_CLOUD_NAME}/image/upload/`;
  private readonly placeholderImage = 'assets/no-image.png';
  // ============================

  constructor(private http: HttpClient) {}

  getPublicNews(page: number = 1): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/public?page=${page}`);
  }

  getLatestNews(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/latest`);
  }

  getNewsBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/detail/${slug}`);
  }

  // ==== Hiển thị ảnh ====
  getThumbnailUrl(thumbnail?: string): string {
  if (!thumbnail) return this.placeholderImage;

  // FIX tất cả trường hợp localhost
  thumbnail = thumbnail
    .replace('http://localhost:3000', 'https://fitsport.io.vn')
    .replace('https://localhost:3000', 'https://fitsport.io.vn')
    .replace('http://127.0.0.1:3000', 'https://fitsport.io.vn');

  if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) {
    return thumbnail;
  }


    const transformation = 'w_800,h_450,c_fill/';
    return `${this.CLOUDINARY_BASE_URL}${transformation}${thumbnail}`;
  }
}
