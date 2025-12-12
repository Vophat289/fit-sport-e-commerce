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

  loading = false;
  errorMessage = '';

  stars = [1, 2, 3, 4, 5];

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    this.fetchReviews(); // ✅ GET ALL ngay khi vào trang
  }

  fetchReviews(): void {
    this.loading = true;
    this.errorMessage = '';

    // ✅ nếu productId/orderId rỗng => service sẽ gọi API không params => GET ALL
    this.reviewService.getAdminReviews({
      productId: this.productId,
      orderId: this.orderId,
    }).subscribe({
      next: (data) => {
        this.reviews = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách đánh giá:', err);
        this.errorMessage = err?.error?.message || 'Không thể tải danh sách đánh giá.';
        this.loading = false;
      },
    });
  }

  onApplyFilter(): void {
    this.fetchReviews();
  }

  onClearFilter(): void {
    this.productId = '';
    this.orderId = '';
    this.fetchReviews(); // ✅ gọi lại GET ALL
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
