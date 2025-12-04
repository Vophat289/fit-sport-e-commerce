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

  // ❌ XÓA newsUpdateSubscription vì không còn dùng nữa
  private newsUpdateSubscription?: Subscription;

  constructor(public newsService: NewsService) {}

  ngOnInit(): void {
    this.loadNews(this.currentPage);

    // ❌ XÓA SUBSCRIBE NÀY VÌ newsUpdated$ KHÔNG TỒN TẠI
    // this.newsUpdateSubscription = this.newsService.newsUpdated$.subscribe(() => {
    //   this.loadNews(this.currentPage);
    // });
  }

  ngOnDestroy(): void {
    this.newsUpdateSubscription?.unsubscribe();
  }

  // =================== LOAD NEWS ===================
  loadNews(page: number = 1): void {
    this.newsService.getPublicNews(page).subscribe({
      next: (res: any) => {
        this.news = (res.data || []).map((item: any) => ({
          ...item,
          slug: item.slug?.trim() || this.generateSlug(item.title || 'untitled')
        }));

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
    img.src = 'https://via.placeholder.com/400x250/000000/FFFFFF?text=FITSPORT';
    img.onerror = null;
  }

  // =================== THUMBNAIL HELPER CHO HTML ===================
  getThumbnailUrl(thumbnail: string | undefined): string {
    return this.newsService.getThumbnailUrl(thumbnail);
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
}
