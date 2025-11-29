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
  private readonly API_URL = 'http://localhost:3000/api/news';

  constructor(private http: HttpClient) {}
  getAllNews(): Observable<News[]> {
  return this.http.get<News[]>(`${this.API_URL}`);  // không có /latest
}

  getNewsBySlug(slug: string) {
  return this.http.get<any>(`${this.API_URL}/news/slug/${slug}`);
}
    createNews(data: CreateNewsData, file?: File): Observable<News> {
    const formData = new FormData();

    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.short_desc) formData.append('short_desc', data.short_desc);
    formData.append('author', data.author || 'Admin');

    // xử lý tags
    if (data.tags) {
      const tagsString = Array.isArray(data.tags)
        ? data.tags.join(',')
        : data.tags;
      formData.append('tags', tagsString);
    }

    if (file) {
      formData.append('thumbnail', file, file.name);
    }

    return this.http.post<News>(this.API_URL, formData);
  }

  updateNewsBySlug(
    slug: string,
    data: UpdateNewsData,
    file?: File
  ): Observable<News> {
    const formData = new FormData();

    if (data.title !== undefined) formData.append('title', data.title);
    if (data.content !== undefined) formData.append('content', data.content);
    if (data.short_desc !== undefined)
      formData.append('short_desc', data.short_desc);
    if (data.author !== undefined) formData.append('author', data.author);

    // xử lý tags
    if (data.tags) {
      const tagsString = Array.isArray(data.tags)
        ? data.tags.join(',')
        : data.tags;
      formData.append('tags', tagsString);
    }

    if (file) {
      formData.append('thumbnail', file, file.name);
    }

    return this.http.put<News>(`${this.API_URL}/slug/${slug}`, formData);
  }
  deleteNews(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  getLatestNews(): Observable<News[]> {
    return this.http.get<News[]>(`${this.API_URL}/latest`);
  }
}
