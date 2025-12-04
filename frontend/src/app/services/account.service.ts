import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | string;
  dob?: string;
  avatarUrl?: string;
}

export interface Address {
  _id: string;
  receiverName: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
  phone: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | string;
  orderDate: string;
  totalAmount: number;
  items: { productName: string; quantity: number; price: number }[];
}

export interface Voucher {
  code: string;
  discountValue: number;
  minOrderValue: number;
  expiryDate: string; // 'dd/MM/yyyy'
  description: string;
  status?: 'ACTIVE' | 'EXPIRING' | 'EXPIRED';
  expiryTime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private baseUrl = '';
  private apiUrl = `${this.baseUrl}/api/account`;

  constructor(private http: HttpClient) {}
  // PROFILE
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }

  updateProfile(data: UserProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, data);
  }

  // --- JWT PAYLOAD ---
  getPayload(): { name: string; email: string } | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = decodeURIComponent(
        Array.prototype.map
          .call(atob(payloadBase64), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(payloadJson);
    } catch (e) {
      console.error('Lỗi khi giải mã JWT:', e);
      return null;
    }
  }

  // --- CẬP NHẬT PROFILE NỘI BỘ ---
  updateProfileData(data: { name: string; email: string; avatarUrl?: string }) {
    console.log('Cập nhật profile nội bộ:', data);
  }
  // ADDRESSES
  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/addresses`);
  }

  createAddress(address: Address): Observable<Address> {
    return this.http.post<Address>(`${this.apiUrl}/addresses`, address);
  }

  updateAddress(address: Address): Observable<Address> {
    return this.http.put<Address>(`${this.apiUrl}/addresses/${address._id}`, address);
  }

  deleteAddress(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/addresses/${id}`);
  }

  // ORDERS
  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  getOrderDetail(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`);
  }

  // VOUCHERS
  getVouchers(): Observable<Voucher[]> {
    return this.http.get<Voucher[]>(`${this.apiUrl}/vouchers`);
  }

  getVoucherDetail(code: string): Observable<Voucher> {
    return this.http.get<Voucher>(`${this.apiUrl}/vouchers/${code}`);
  }
}
