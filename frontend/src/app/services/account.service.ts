import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

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
  order_code: string;
  total_price: number;
  delivery_fee: number;
  status: string;
  payment_status: string;
  createdAt: string;

  receiver_name?: string;
  receiver_mobile?: string;
  receiver_address?: string;
  first_item_image_url?: string;
  first_item_name?: string;
}
export interface Review {
  _id?: string;
  product_id: string;
  order_id: string;
  rating: number;
  comment: string;
}

export interface ProductVariant {
  _id: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
}

export interface Voucher {
  code: string;
  discountValue: number;
  minOrderValue: number;
  discountType?: 'percentage' | 'fixed';
  expiryDate: string;
  description: string;
  status?: 'ACTIVE' | 'EXPIRING' | 'EXPIRED';
  expiryTime?: number;
  type?: 'percent' | 'fixed'; 
  value?: number;              
  min_order_value?: number;    
  start_date?: string;      
  end_date?: string;
}
export interface SimpleProductDetail {
    _id: string;
    name: string;
    slug?: string;
    image?: string[];
}
@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private baseUrl = '';
  private apiUrl = `${this.baseUrl}/api/account`;
  private review = 'http://localhost:3000';

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
    return this.http.get<Order[]>(`/api/orders/account/my-orders`);
  }

  getOrderDetail(id: string): Observable<any> {
    return this.http.get(`/api/orders/account/${id}`);
  }
  getProductDetailById(productId: string): Observable<SimpleProductDetail> {
    // 1. Tải danh sách sản phẩm để tìm SLUG
    return this.http.get<SimpleProductDetail[]>(`${this.baseUrl}/api/products/`).pipe(
        map((products: SimpleProductDetail[]) => {
            const foundProduct = products.find(p => p._id === productId);
            
            if (foundProduct && foundProduct.slug) {
                // Trả về slug nếu tìm thấy
                return foundProduct.slug;
            }
            
            throw new Error(`Product with ID ${productId} or Slug not found in list.`);
        }),
        // 2. Dùng switchMap để chuyển từ SLUG sang gọi API chi tiết
        switchMap((slug: string) => {
            return this.http.get<SimpleProductDetail>(`${this.baseUrl}/api/products/${slug}`);
        })
    );
}
      cancelOrderApi(orderId: string): Observable<any> {
        return this.http.put(`/api/orders/account/${orderId}/cancel`, {});
      }
      updateProductVariantStock(variantId: string, quantityToAdd: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/product-variants/${variantId}/stock/revert`, { quantityToAdd });
      }
      getVariantById(variantId: string): Observable<{ sizeName: string, colorName: string, price: number, quantity: number }> {
        return this.http.get<{ sizeName: string, colorName: string, price: number, quantity: number }>(`/api/account/variant/${variantId}`);
      }
      

  // VOUCHERS
  getVouchers(): Observable<Voucher[]> {
    return this.http.get<Voucher[]>(`${this.apiUrl}/vouchers`);
  }

  getVoucherDetail(code: string): Observable<Voucher> {
    return this.http.get<Voucher>(`${this.apiUrl}/vouchers/${code}`);
  }
  //đánh giá
  submitReview(review: Review): Observable<any> {
    const token = localStorage.getItem('token');

  const headers = {
    Authorization: `Bearer ${token}`
  };
    return this.http.post(`${this.review}/api/reviews`, review);
  }

  getReviewsByOrder(orderId: string): Observable<Review[]> {
    // Lấy tất cả review của đơn hàng, để hiển thị lại nếu muốn
    return this.http.get<Review[]>(`/api/reviews?order_id=${orderId}`);
  }
  getUserReviews(): Observable<any> {
  const token = localStorage.getItem('token');

  const headers = {
    Authorization: `Bearer ${token}`
  };

  return this.http.get(`${this.review}/api/reviews/user`, { headers });
}
  getProductReviews(productId: string): Observable<any> {
      return this.http.get<any>(`${this.review}/api/reviews/product/${productId}`);
    }
}
