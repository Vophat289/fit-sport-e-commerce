import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ReviewApiResponse<T> {
  success: boolean;
  total?: number;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private apiUrl = '/api/admin/reviews';

  constructor(private http: HttpClient) {}
  getAdminReviews(filters?: { productId?: string; orderId?: string; status?: string }): Observable<any[]> {
    let params = new HttpParams();

    const productId = filters?.productId?.trim();
    const orderId = filters?.orderId?.trim();
    const status = filters?.status?.trim();

    if (productId) params = params.set('productId', productId);
    if (orderId) params = params.set('orderId', orderId);
    if (status && status !== 'all') params = params.set('status', status);

    return this.http
      .get<ReviewApiResponse<any[]>>(this.apiUrl, { params })
      .pipe(map((res) => res?.data || []));
  }
}
