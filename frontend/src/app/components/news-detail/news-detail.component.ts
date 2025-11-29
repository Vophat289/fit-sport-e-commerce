import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [
    CommonModule,       // *ngIf, *ngFor, date pipe
    RouterModule,       // routerLink, queryParams
    HttpClientModule    // HttpClient
  ],
  templateUrl: './news-detail.component.html',
  styleUrls: ['./news-detail.component.css']
})
export class NewsDetailComponent {

  loading: boolean = true;
  article: any = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.http.get(`http://localhost:3000/api/news/slug/${slug}`).subscribe({
        next: (res: any) => {
          this.article = res.data ?? res;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.article = null;
        }
      });
    }
  }

  // Nếu trong HTML có button share()
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
