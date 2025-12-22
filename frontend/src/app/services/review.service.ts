import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ReviewApiResponse<T> {
  success: boolean;
  total?: number;
  data: T;
  message?: string;
}

export interface AdminReviewFilters {
  productId?: string;
  orderId?: string;
  status?: string;
  rating?: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private apiUrl = '/api/admin/reviews';

  constructor(private http: HttpClient) {}

  getAdminReviews(filters?: AdminReviewFilters): Observable<any[]> {
    let params = new HttpParams();

    const productId = filters?.productId?.trim();
    const orderId = filters?.orderId?.trim();
    const status = filters?.status?.trim();
    const rating = filters?.rating;

    if (productId) params = params.set('productId', productId);
    if (orderId) params = params.set('orderId', orderId);
    if (status && status !== 'all') params = params.set('status', status);

    // ✅ rating 1..5
    if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
      params = params.set('rating', String(rating));
    }

    return this.http
      .get<ReviewApiResponse<any[]>>(this.apiUrl, { params })
      .pipe(map((res) => res?.data || []));
  }
}
