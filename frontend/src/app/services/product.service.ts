import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from './category.service';

export interface Product {
  _id?: string;
  name: string;
  slug?: string;
  price: number;
  description?: string;
  category?: Category | string;
  image?: string[];
  colors?: string[];
  sizes?: string[];
  createdAt?: string;
  updatedAt?: string;
  viewCount?: number;
  averageRating?: number;
  totalRatings?: number;
  _displayIndex?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private adminApiUrl = 'http://localhost:3000/api/admin';

  private apiUrl = '/api/products';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl); //Observable<Product[]> là kiểu dữ liệu trả vè mảng
  }

  getBySlugProduct(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${slug}`); //<Product> trả về 1 product (k phải array)
  }

  getByCategorySlug(slug: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/category/${slug}`);
  }
  incrementView(slug: string): Observable<{ viewCount: number }> {
    return this.http.post<{ viewCount: number }>(
      `${this.apiUrl}/${slug}/view`,
      {}
    );
  }
  searchProducts(
    query: string
  ): Observable<{ query: string; count: number; products: Product[] }> {
    return this.http.get<{ query: string; count: number; products: Product[] }>(
      `${this.apiUrl}/search?q=${encodeURIComponent(query)}`
    );
  }

  getAllProducts() {
    return this.http.get<any>(this.apiUrl);
  }

  createProduct(data: any) {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateProduct(id: string, data: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteProduct(id: string) {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  } // ✅ HÀM LẤY BIẾN THỂ KHẢ DỤNG (Cho Modal Frontend)

  getAvailableVariants(productId: string): Observable<any> {
    // GET /api/products/variants/:productId
    return this.http.get<any>(`${this.adminApiUrl}/variants/${productId}`);
  }

  getVariantDetails(
    productId: string,
    sizeId: string,
    colorId: string
  ): Observable<any> {
    // GET /api/products/variant-details?product=...
    const url = `${this.adminApiUrl}/variant-details?product=${productId}&size=${sizeId}&color=${colorId}`;
    return this.http.get(url);
  }
}
