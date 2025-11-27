import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';   
import { NewsService, News } from '../../services/news.service';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule   
  ],
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit {

  news: News[] = [];
  paginatedNews: News[] = [];

  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.loadNews();
  }

  loadNews() {
    this.newsService.getAllNews().subscribe({
      next: (res: any) => {
        const newsData = Array.isArray(res) ? res : res.data || [];

        this.news = newsData.map((item: any) => ({
          ...item,
          slug: item.slug?.trim() ? item.slug : this.generateSlug(item.title || 'untitled')
        }));

        this.totalPages = Math.ceil(this.news.length / this.itemsPerPage);
        this.updatePaginatedNews();
        console.log(`Đã tải ${this.news.length} bài viết – ${this.totalPages} trang`);
      },
      error: (err: any) => console.error('Lỗi tải tin tức:', err)
    });
  }

  updatePaginatedNews() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedNews = this.news.slice(start, end);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedNews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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