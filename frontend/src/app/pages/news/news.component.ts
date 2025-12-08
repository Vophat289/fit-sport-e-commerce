// src/app/pages/news/news.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NewsService, News } from '../../services/news.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit, OnDestroy {

  news: News[] = [];
  paginatedNews: News[] = [];
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;
  totalItems = 0;

  private newsUpdateSubscription?: Subscription;

  constructor(public newsService: NewsService) {}

  ngOnInit(): void {
    this.loadNews(this.currentPage);
  }

  ngOnDestroy(): void {
    this.newsUpdateSubscription?.unsubscribe();
  }

  // =================== LOAD NEWS ===================
  loadNews(page: number = 1): void {
    this.newsService.getPublicNews(page).subscribe({
      next: (res: any) => {
        const raw: any[] = res.data || [];

        this.news = raw.map((item: any) => {
          const normalized: News = {
            ...item,
            slug: item.slug?.trim() || this.generateSlug(item.title || 'untitled')
          };
          return {
            ...normalized,
            displayThumbnail: this.newsService.getThumbnailUrl(normalized.thumbnail)
          };
        });

        this.paginatedNews = this.news;
        this.currentPage = res.pagination?.currentPage || page;
        this.totalPages = res.pagination?.totalPages || 1;
        this.totalItems = res.pagination?.totalItems || 0;
      },
      error: (err) => {
        console.error('Lỗi tải tin tức:', err);
        this.news = [];
        this.paginatedNews = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalItems = 0;
      }
    });
  }

  // =================== PAGINATION ===================
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadNews(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =================== HANDLE IMAGE ERROR ===================
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = this.newsService.getThumbnailUrl();
  }

  // =================== SLUG GENERATOR ===================
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9 -]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  getFirstTag(item: News): string | null {
  if (!item.tags) return null;

  if (Array.isArray(item.tags)) {
    return item.tags[0] || null;
  }

  // nếu backend trả string "a, b, c"
  const arr = item.tags
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  return arr[0] || null;
}
}
