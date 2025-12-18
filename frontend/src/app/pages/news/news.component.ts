// src/app/pages/news/news.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsService, News } from '../../services/news.service';
import { Subscription } from 'rxjs';

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

  //  Tag filter 
  tagQuery = '';        
  selectedTag = '';     

  private newsUpdateSubscription!: Subscription;

  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.loadNews(this.currentPage);

    this.newsUpdateSubscription = this.newsService.newsUpdated$.subscribe(() => {
      this.loadNews(this.currentPage);
    });
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
          slug: item.slug?.trim() || this.generateSlug(item.title || 'untitled'),
          thumbnail: this.newsService.getThumbnailUrl(item.thumbnail)
        }));

        this.currentPage = res.pagination?.currentPage || page;
        this.totalPages = res.pagination?.totalPages || 1;
        this.totalItems = res.pagination?.totalItems || 0;

        // áp filter sau khi load
        this.applyTagFilter();
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

  // =================== TAG FILTER (FE ONLY) ===================
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
    return (s || '')
      .trim()
      .replace(/^#/, '')
      .toLowerCase();
  }

  private applyTagFilter(): void {
    const q = this.normalizeTag(this.selectedTag || this.tagQuery);

    if (!q) {
      this.paginatedNews = this.news;
      return;
    }

    this.paginatedNews = this.news.filter((n: any) => {
      const tags: string[] = Array.isArray(n.tags) ? n.tags : [];
      return tags.some(t => this.normalizeTag(t) === q || this.normalizeTag(t).includes(q));
    });
  }

  getAvailableTags(): string[] {
    const set = new Set<string>();
    (this.news || []).forEach((n: any) => {
      const tags: string[] = Array.isArray(n.tags) ? n.tags : [];
      tags.forEach(t => {
        const norm = this.normalizeTag(t);
        if (norm) set.add(norm);
      });
    });
    return Array.from(set).slice(0, 12);
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
