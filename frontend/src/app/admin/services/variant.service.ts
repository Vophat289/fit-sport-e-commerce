import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '@app/services/product.service';
// --- INTERFACES SỬ DỤNG TRONG SERVICE ---
interface SizeOption {
  _id: string;
  name: string;
}

interface ColorOption {
  _id: string;
  name: string;
  hex_code: string;
}
export interface VariantDetails {
  price: number;
  quantity: number;
}
export interface AvailableOption {
  id: string;
  name: string;
  hex?: string;
}

export interface AvailableVariants {
  availableSizes: AvailableOption[];
  availableColors: AvailableOption[];
}
// Interface cho dữ liệu Biến thể khi gửi đi (chỉ dùng ID)
interface VariantPayload {
  product_id: string;
  size_id: string;
  color_id: string;
  price: number;
  quantity: number;
}

// Interface cho dữ liệu Biến thể nhận về (có thể có _id)
type VariantResponse = {
  _id: string;
  product_id: string | any;
  size_id: SizeOption;
  color_id: ColorOption;
  price: number;
  quantity: number;
};

@Injectable({
  providedIn: 'root',
})
export class VariantService {
  private adminApiUrl = '/api/admin';
  private productDetailUrl = `${this.adminApiUrl}/product-detail`;
  private apiUrl = `${this.adminApiUrl}/variants`;
  private sizeUrl = `${this.adminApiUrl}/sizes`;
  private colorUrl = `${this.adminApiUrl}/colors`;

  constructor(private http: HttpClient) {}

  getSizes(): Observable<SizeOption[]> {
    return this.http.get<SizeOption[]>(this.sizeUrl);
  }

  getColors(): Observable<ColorOption[]> {
    return this.http.get<ColorOption[]>(this.colorUrl);
  }

  getVariantsByProduct(productId: string): Observable<VariantResponse[]> {
    return this.http.get<VariantResponse[]>(
      `${this.apiUrl}/product/${productId}`
    );
  }

  addVariant(variant: VariantPayload): Observable<VariantResponse> {
    return this.http.post<VariantResponse>(this.apiUrl, variant);
  }

  updateVariant(
    id: string,
    variant: VariantPayload
  ): Observable<VariantResponse> {
    return this.http.put<VariantResponse>(`${this.apiUrl}/${id}`, variant);
  }

  deleteVariant(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  getProductDetails(id: string): Observable<Product> {
    return this.http.get<any>(`${this.productDetailUrl}/${id}`);
  }
  addSize(sizeName: string) {
    return this.http.post<any>(`/api/admin/sizes`, { name: sizeName });
  }
  addColor(payload: { name: string; hex_code: string }) {
    return this.http.post(`${this.apiUrl}/colors`, payload);
  }
}
