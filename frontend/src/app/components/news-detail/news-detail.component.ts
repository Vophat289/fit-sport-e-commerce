// src/app/components/news-detail/news-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { NewsService, News } from '../../services/news.service';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './news-detail.component.html',
  styleUrls: ['./news-detail.component.css']
})
export class NewsDetailComponent implements OnInit {

  loading = true;
  article: News | null = null;

  constructor(
    private route: ActivatedRoute,
    private newsService: NewsService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');

      if (!slug) {
        this.loading = false;
        return;
      }

      this.loading = true;

      this.newsService.getNewsBySlug(slug).subscribe({
        next: (res: any) => {
          this.article = res?.data || res;
          this.loading = false;
        },
        error: (err: any) => {              // 🔧 err: any để hết TS7006
          console.error('Lỗi load bài viết:', err);
          this.loading = false;
        }
      });
    });
  }

  // Lấy URL ảnh
  getThumbnailUrl(): string {
    if (!this.article) {
      return this.newsService.getThumbnailUrl();
    }
    return this.newsService.getThumbnailUrl(this.article.thumbnail);
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = this.newsService.getThumbnailUrl();
    img.onerror = null;
  }

  // Dùng cho phần *ngFor="let tag of tags" trong HTML
  get tags(): string[] {
    if (!this.article || !this.article.tags) return [];

    if (Array.isArray(this.article.tags)) {
      return this.article.tags;
    }

    return this.article.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  }

  share() {
    if (!this.article) return;
    const url = window.location.href;
    const text = `Check this news: ${this.article.title}`;
    if (navigator.share) {
      navigator.share({ title: this.article.title, text, url }).catch(console.error);
    } else {
      alert('Sharing not supported in this browser');
    }
  }
}
