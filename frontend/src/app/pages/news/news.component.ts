import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NewsService, News } from '../../services/news.service';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './news.component.html',
  styleUrl: './news.component.css'
})
export class NewsComponent implements OnInit {

  news: News[] = [];
  paginatedNews: News[] = [];

  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;
  totalItems = 0;

  constructor(private newsService: NewsService) { }

  ngOnInit(): void {
    this.loadNews(this.currentPage);
  }

  loadNews(page: number = 1) {
    this.newsService.getPublicNews(page).subscribe({
      next: (res: any) => {
        // res từ backend: { success: true, data: [...], pagination: { ... } }
        this.news = (res.data || []).map((item: any) => ({
          ...item,
          slug: item.slug?.trim() || this.generateSlug(item.title || 'untitled')
        }));

        this.paginatedNews = this.news;
        this.currentPage = res.pagination?.currentPage || page;
        this.totalPages = res.pagination?.totalPages || 1;
        this.totalItems = res.pagination?.totalItems || 0;

        console.log(`Đã tải trang ${this.currentPage}/${this.totalPages} – ${this.totalItems} bài viết công khai`);
      },
      error: (err: any) => {
        console.error('Lỗi tải tin tức:', err);
        this.news = [];
        this.paginatedNews = [];
      }
    });
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;

    this.currentPage = page;
    this.loadNews(page); // gọi lại API để lấy dữ liệu trang mới
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Tạo mảng trang để hiển thị phân trang (1,2,3...)
  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

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