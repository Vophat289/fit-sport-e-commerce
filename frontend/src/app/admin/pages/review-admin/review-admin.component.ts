import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../services/review.service';

@Component({
  selector: 'app-review-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-admin.component.html',
  styleUrls: ['./review-admin.component.css'],
})
export class ReviewAdminComponent implements OnInit {
  reviews: any[] = [];

  productId = '';
  orderId = '';

  // ✅ filter sao
  ratingFilter: number | null = null;
  ratingOptions = [5, 4, 3, 2, 1];

  loading = false;
  errorMessage = '';

  stars = [1, 2, 3, 4, 5];

  // ✅ Pagination FE
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    this.fetchReviews();
  }

  // ===== Pagination helpers =====
  get paginatedReviews(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.reviews.slice(start, start + this.pageSize);
  }

  get showingFrom(): number {
    if (!this.reviews.length) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.reviews.length);
  }

  private recalcPagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.reviews.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
  }

  onPageSizeChange(): void {
    // reset về trang 1 cho dễ nhìn
    this.currentPage = 1;
    this.recalcPagination();
  }

  // ===== Filters =====
  setRatingFilter(star: number | null): void {
    // click lại cùng sao -> toggle về tất cả
    this.ratingFilter = this.ratingFilter === star ? null : star;
    this.currentPage = 1; // ✅ reset page khi đổi filter
    this.fetchReviews();
  }

  fetchReviews(): void {
    this.loading = true;
    this.errorMessage = '';

    this.reviewService
      .getAdminReviews({
        productId: this.productId,
        orderId: this.orderId,
        rating: this.ratingFilter ?? undefined,
      })
      .subscribe({
        next: (data) => {
          this.reviews = data || [];
          this.recalcPagination();
          this.loading = false;
        },
        error: (err) => {
          console.error('Lỗi khi tải danh sách đánh giá:', err);
          this.errorMessage = err?.error?.message || 'Không thể tải danh sách đánh giá.';
          this.reviews = [];
          this.currentPage = 1;
          this.totalPages = 1;
          this.loading = false;
        },
      });
  }

  onApplyFilter(): void {
    this.currentPage = 1;
    this.fetchReviews();
  }

  onClearFilter(): void {
    this.productId = '';
    this.orderId = '';
    this.ratingFilter = null;
    this.currentPage = 1;
    this.fetchReviews();
  }

  trackById(_: number, item: any) {
    return item?._id;
  }

  getProductName(r: any): string {
    return r?.product?.name || '—';
  }

  getUserName(r: any): string {
    return r?.user?.name || r?.user?.email || '—';
  }
}
