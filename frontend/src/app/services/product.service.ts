import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from './category.service';

export interface Product {
  _id?: string;
  name: string;
  slug?: string;
  price: number;
  minPrice: number;
  maxPrice: number;
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
  availableColors?: {
    id: string;
    name: string;
    hex_code?: string;
  }[];

  availableSizes?: {
    id: string;
    name: string;
  }[];
  variants?: {
    size_id: string;
    color_id: string;
    price: number;
    quantity: number;
  }[];
  displayPrice?: number;
  displayPrices?: number[]
  displayColors?: string[];
  displaySizes?: string[];
}
export interface VariantSelection {
  sizeId: string;
  sizeName: string;
  colorId: string;
  colorName: string;
  quantity: number;
  price: number;
  stock: number;
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

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  // Sử dụng relative URL - nginx sẽ proxy đến backend
  private apiUrl = '/api/products';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
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
  }

  getAvailableVariants(productId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/variants/${productId}`);
  }
  getVariantDetails(
    productId: string,
    sizeId: string,
    colorId: string
  ): Observable<VariantDetails> {
    const url = `${this.apiUrl}/variant-details?product=${productId}&size=${sizeId}&color=${colorId}`;
    return this.http.get<VariantDetails>(url);
  }
}
