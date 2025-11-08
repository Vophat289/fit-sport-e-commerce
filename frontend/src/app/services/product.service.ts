import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product{
  _id?: String;
  name: String;
  slug?: String;
  price: Number;
  description?: String;
  category?: {
    _id: String;
    name: String;
  } | String;
  image?: String[];
  createdAt?: String;
  updatedAt?: String;
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

  getBySlugProduct(slug: String): Observable<Product>{
    return this.http.get<Product>(`${this.apiUrl}/${slug}`); //<Product> trả về 1 product (k phải array)
  }
}
