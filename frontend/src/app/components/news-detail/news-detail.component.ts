// src/app/pages/news-detail/news-detail.component.ts
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

  loading: boolean = true;
  article: News | null = null;

  constructor(
    private route: ActivatedRoute,
    private newsService: NewsService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.newsService.getNewsBySlug(slug).subscribe({
        next: (res) => {
          // Nếu API trả về object data hoặc trực tiếp
          this.article = (res as any).data ?? res;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.article = null;
        }
      });
    } else {
      this.loading = false;
      this.article = null;
    }
  }

  // Lấy URL ảnh chuẩn từ NewsService
  getThumbnailUrl(thumbnail?: string): string {
    return this.newsService.getThumbnailUrl(thumbnail || this.article?.thumbnail);
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/600x400/000000/FFFFFF?text=FITSPORT';
    img.onerror = null;
  }

  // Chia sẻ bài viết
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
