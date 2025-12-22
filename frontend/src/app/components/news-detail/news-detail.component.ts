// src/app/pages/news-detail/news-detail.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';
import { NewsService, News } from '../../services/news.service';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './news-detail.component.html',
  styleUrls: ['./news-detail.component.css']
})
export class NewsDetailComponent implements OnInit, OnDestroy {

  loading: boolean = true;
  article: News | null = null;

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private newsService: NewsService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap
      .pipe(
        switchMap((params) => {
          const slug = (params.get('slug') || '').trim();
          this.loading = true;
          this.article = null;
          return this.newsService.getNewsBySlug(slug);
        })
      )
      .subscribe({
        next: (res) => {
          this.article = (res as any).data ?? (res as any);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.article = null;
        }
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get tags(): string[] {
    return this.article?.tags || [];
  }

  getThumbnailUrl(thumbnail?: string): string {
    return this.newsService.getThumbnailUrl(thumbnail || this.article?.thumbnail);
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/600x400/000000/FFFFFF?text=FITSPORT';
    img.onerror = null;
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
