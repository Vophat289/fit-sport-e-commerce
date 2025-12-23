import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Voucher } from '@app/services/voucher.service';

interface ApplyVoucherResponse {
  success: boolean;
  type: 'success' | 'invalid' | 'condition' | 'error';
  message?: string;
  code?: string;
  discount?: number;
  voucherType?: 'percent' | 'fixed';
}

interface MyVouchersResponse {
  success: boolean;
  vouchers: Voucher[];
}

@Injectable({
  providedIn: 'root',
})
export class UserVoucherService {
  private apiUrl = '/api/voucher';

  constructor(private http: HttpClient) {}

  getMyVouchers(): Observable<MyVouchersResponse> {
    return this.http.get<MyVouchersResponse>(`${this.apiUrl}/my-vouchers`);
  }

  applyVoucher(code: string, subtotal: number): Observable<ApplyVoucherResponse> {
    return this.http.post<ApplyVoucherResponse>(`${this.apiUrl}/apply`, {
      code,
      subtotal,
    });
  }
}


