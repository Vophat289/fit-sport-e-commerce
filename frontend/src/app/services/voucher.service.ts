import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Voucher {
  code: string;
  value: number;
  type: 'percent' | 'fixed';
  min_order_value: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used_count: number;
  created_at?: string;
  updated_at?: string;
}

interface VoucherListResponse {
  total: number;
  page: number;
  limit: number;
  vouchers: Voucher[];
}

@Injectable({
  providedIn: 'root'
})
export class VoucherService {
  private apiUrl = 'http://localhost:3000/api/admin/vouchers'; 

  constructor(private http: HttpClient) {}

  getVouchers(page: number = 1, limit: number = 10, search: string = ''): Observable<VoucherListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('search', search);
    return this.http.get<VoucherListResponse>(this.apiUrl, { params });
  }

  createVoucher(data: Partial<Voucher>): Observable<Voucher> {
    return this.http.post<Voucher>(this.apiUrl, data);
  }

  updateVoucher(code: string, data: Partial<Voucher>): Observable<Voucher> {
    return this.http.put<Voucher>(`${this.apiUrl}/${code}`, data);
  }

  deleteVoucher(code: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${code}`);
  }
}
