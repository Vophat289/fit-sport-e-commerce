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

  private apiUrl = "http://localhost:3000/api/products"

  constructor(private http: HttpClient) { }

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl); //Observable<Product[]> là kiểu dữ liệu trả vè mảng
  }

  getBySlugProduct(slug: string): Observable<Product>{
    return this.http.get<Product>(`${this.apiUrl}/${slug}`); //<Product> trả về 1 product (k phải array)
  }

  getProductsByCategory(categories: string): Observable<Product[]>{
    return this.http.get<Product[]>(`${this.apiUrl}/categories/${categories}`);
  }
}
