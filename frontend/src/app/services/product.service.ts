import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from './category.service';

export interface Product{
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
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
private adminApiUrl = "http://localhost:3000/api/admin";
  private apiUrl = "http://localhost:3000/api/products"; // API chính cho sản phẩm

  constructor(private http: HttpClient) { }

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getBySlugProduct(slug: string): Observable<Product>{
    return this.http.get<Product>(`${this.apiUrl}/${slug}`);
  }

  getByCategorySlug(slug: string): Observable<Product[]>{
    return this.http.get<Product[]>(`${this.apiUrl}/category/${slug}`);
  }

  // ✅ HÀM LẤY BIẾN THỂ KHẢ DỤNG (Cho Modal Frontend)
  getAvailableVariants(productId: string): Observable<any> {
    // GET /api/products/variants/:productId
    return this.http.get<any>(`${this.adminApiUrl}/variants/${productId}`); 
  }
  
  // ✅ HÀM LẤY CHI TIẾT BIẾN THỂ (Giá và Tồn kho)
  getVariantDetails(productId: string, sizeId: string, colorId: string): Observable<any> {
    // GET /api/products/variant-details?product=...
    const url = `${this.adminApiUrl}/variant-details?product=${productId}&size=${sizeId}&color=${colorId}`;
        return this.http.get(url);
  }
}