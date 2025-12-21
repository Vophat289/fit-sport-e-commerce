// src/app/pages/news/news.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsService, News } from '../../services/news.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit, OnDestroy {

  news: News[] = [];
  paginatedNews: News[] = [];

  currentPage = 1;
  itemsPerPage = 4;
  totalPages = 1;
  totalItems = 0;

  // tag filter
  tagQuery = '';
  selectedTag = '';

  // kiểm tra có đang chọn bài hay chưa
  hasSelectedArticle = false;

  private newsUpdateSubscription!: Subscription;
  private routerSub!: Subscription;

  constructor(
    private newsService: NewsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNews(this.currentPage);

    this.newsUpdateSubscription = this.newsService.newsUpdated$
      .subscribe(() => this.loadNews(this.currentPage));

    // theo dõi URL để biết có đang xem detail hay không
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.hasSelectedArticle =
          this.router.url.startsWith('/news/') &&
          this.router.url.split('/').length >= 3;
      });
  }

  ngOnDestroy(): void {
    this.newsUpdateSubscription?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  // ================= LOAD NEWS =================
  loadNews(page: number = 1): void {
    this.newsService.getPublicNews(page).subscribe({
      next: (res: any) => {
        this.news = (res.data || []).map((item: any) => ({
          ...item,
          slug: item.slug?.trim() || this.generateSlug(item.title || 'untitled'),
          thumbnail: this.newsService.getThumbnailUrl(item.thumbnail)
        }));

        this.currentPage = res.pagination?.currentPage || page;
        this.totalPages = res.pagination?.totalPages || 1;
        this.totalItems = res.pagination?.totalItems || 0;

        this.applyTagFilter();
      },
      error: () => {
        this.news = [];
        this.paginatedNews = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.totalItems = 0;
      }
    });
  }

  // ================= TAG FILTER =================
  onTagInput(): void {
    this.selectedTag = '';
    this.applyTagFilter();
  }

  selectTag(tag: string): void {
    this.selectedTag = tag;
    this.tagQuery = `#${tag}`;
    this.applyTagFilter();
  }

  clearTagFilter(): void {
    this.tagQuery = '';
    this.selectedTag = '';
    this.paginatedNews = this.news;
  }

  normalizeTag(s: string): string {
    return (s || '').replace(/^#/, '').trim().toLowerCase();
  }

  private applyTagFilter(): void {
    const q = this.normalizeTag(this.selectedTag || this.tagQuery);
    if (!q) {
      this.paginatedNews = this.news;
      return;
    }

    this.paginatedNews = this.news.filter(n =>
      (n.tags || []).some(t =>
        this.normalizeTag(t).includes(q)
      )
    );
  }

  getAvailableTags(): string[] {
    const set = new Set<string>();
    this.news.forEach(n =>
      (n.tags || []).forEach(t => {
        const norm = this.normalizeTag(t);
        if (norm) set.add(norm);
      })
    );
    return Array.from(set).slice(0, 12);
  }

  // ================= PAGINATION =================
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadNews(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ================= IMAGE ERROR =================
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/400x250/000000/FFFFFF?text=FITSPORT';
    img.onerror = null;
  }

  // ================= SLUG =================
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
