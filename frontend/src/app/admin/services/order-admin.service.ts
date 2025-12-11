import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface cho đơn hàng
export interface Order {
  _id: string;
  order_code: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  receiver: {
    name: string;
    mobile: string;
    address: string;
  };
  total_price: number;
  delivery_fee: number;
  final_amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  payment_method: 'COD' | 'VNPAY';
  payment_status: 'INIT' | 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

// Interface cho chi tiết đơn hàng
export interface OrderDetail {
  _id: string;
  order_code: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  receiver: {
    name: string;
    mobile: string;
    address: string;
  };
  items: OrderItem[];
  pricing: {
    total_items: number;
    total_price: number;
    delivery_fee: number;
    voucher_discount: number;
    final_amount: number;
  };
  voucher: {
    code: string;
    value: number;
    type: string;
  } | null;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  payment_method: 'COD' | 'VNPAY';
  payment_status: 'INIT' | 'PENDING' | 'SUCCESS' | 'FAILED';
  vnpay_transaction_id: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id: string;
  quantity: number;
  price: number;
  subtotal: number;
  product: {
    _id: string;
    name: string;
    slug: string;
    image: string;
  };
  variant: {
    size: string;
    color: string;
    colorHex: string;
    image: string;
  };
}

interface OrderListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  orders: Order[];
}

interface OrderDetailResponse {
  success: boolean;
  order: OrderDetail;
}

interface UpdateStatusResponse {
  success: boolean;
  message: string;
  order: {
    _id: string;
    order_code: string;
    status: string;
    updatedAt: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OrderAdminService {
  private apiUrl = '/api/admin/orders';

  constructor(private http: HttpClient) {}

  // Lấy danh sách đơn hàng
  getOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    payment_status?: string;
    payment_method?: string;
    search?: string;
  }): Observable<OrderListResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.payment_status) httpParams = httpParams.set('payment_status', params.payment_status);
    if (params.payment_method) httpParams = httpParams.set('payment_method', params.payment_method);
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<OrderListResponse>(this.apiUrl, { params: httpParams });
  }

  // Lấy chi tiết đơn hàng
  getOrderDetail(orderId: string): Observable<OrderDetailResponse> {
    return this.http.get<OrderDetailResponse>(`${this.apiUrl}/${orderId}`);
  }

  // Cập nhật trạng thái đơn hàng
  updateOrderStatus(orderId: string, status: string): Observable<UpdateStatusResponse> {
    return this.http.put<UpdateStatusResponse>(`${this.apiUrl}/${orderId}/status`, { status });
  }

  // Lấy thống kê đơn hàng (optional)
  getOrderStats(startDate?: string, endDate?: string): Observable<any> {
    let httpParams = new HttpParams();
    if (startDate) httpParams = httpParams.set('startDate', startDate);
    if (endDate) httpParams = httpParams.set('endDate', endDate);
    return this.http.get(`${this.apiUrl}/stats`, { params: httpParams });
  }
}

