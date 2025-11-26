import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NewsService, News } from '../../services/news.service';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit {

  news: News[] = [];
  isExpanded: boolean[] = [];

  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.loadNews();
  }

  loadNews() {
    this.newsService.getAllNews().subscribe({
      next: (res: News[]) => {
        this.news = res.map(item => {
          // FIX slug nếu backend quên tạo
          if (!item.slug || item.slug === 'undefined' || item.slug.trim() === '') {
            item.slug = this.generateSlug(item.title);
          }
          return item;
        });
        this.isExpanded = new Array(this.news.length).fill(false);
        console.log('Tin tức đã tải:', this.news); 
      },
      error: (err) => {
        console.error('Lỗi khi load tin tức:', err);
      }
    });
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

  toggleContent(index: number) {
    this.isExpanded[index] = !this.isExpanded[index];
  }
}