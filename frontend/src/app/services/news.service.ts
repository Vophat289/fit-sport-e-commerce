// src/app/services/news.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  // ĐỔI THÀNH ĐÚNG ĐƯỜNG DẪN CỦA BẠN (admin/news)
  private readonly API_URL = 'http://localhost:3000/api/admin/news';

  constructor(private http: HttpClient) {}

  // ====================== PUBLIC (CHO TRANG CHỦ & TRANG BÀI VIẾT) ======================
  // Dùng để hiển thị danh sách bài viết – CHỈ LẤY BÀI isActive: true
  getPublicNews(page: number = 1): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/public?page=${page}`);
  }

  // Dùng cho trang chủ (6 bài mới nhất)
  getLatestNews(limit: number = 6): Observable<News[]> {
    return this.http.get<News[]>(`${this.API_URL}/latest?limit=${limit}`);
  }

  // Chi tiết bài viết theo slug – cũng phải kiểm tra isActive
  getNewsBySlug(slug: string): Observable<News> {
    return this.http.get<News>(`${this.API_URL}/detail/${slug}`);
  }

  // ====================== ADMIN (GIỮ NGUYÊN ĐỂ ADMIN DÙNG) ======================
  // Lấy TẤT CẢ bài viết (kể cả đã ẩn) – dành cho trang admin
  getAllNewsAdmin(): Observable<News[]> {
    return this.http.get<News[]>(`${this.API_URL}`);
  }

  // Tạo bài viết (admin)
  createNews(data: CreateNewsData, file?: File): Observable<News> {
    const formData = new FormData();

    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.short_desc) formData.append('short_desc', data.short_desc);
    formData.append('author', data.author || 'Admin');

    if (data.tags) {
      const tagsString = Array.isArray(data.tags) ? data.tags.join(',') : data.tags;
      formData.append('tags', tagsString);
    }

    if (file) {
      formData.append('thumbnail', file, file.name);
    }

    return this.http.post<News>(this.API_URL, formData);
  }

  // Cập nhật bài viết (admin)
  updateNewsBySlug(slug: string, data: UpdateNewsData, file?: File): Observable<News> {
    const formData = new FormData();

    if (data.title !== undefined) formData.append('title', data.title);
    if (data.content !== undefined) formData.append('content', data.content);
    if (data.short_desc !== undefined) formData.append('short_desc', data.short_desc);
    if (data.author !== undefined) formData.append('author', data.author);

    if (data.tags) {
      const tagsString = Array.isArray(data.tags) ? data.tags.join(',') : data.tags;
      formData.append('tags', tagsString);
    }

    if (file) {
      formData.append('thumbnail', file, file.name);
    }

    return this.http.put<News>(`${this.API_URL}/slug/${slug}`, formData);
  }

  // Xóa bài viết (admin)
  deleteNews(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  // Toggle ẩn/hiện (nếu bạn có nút riêng)
  toggleNewsStatus(id: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}/toggle-hide`, {});
  }
}