// src/app/services/favorite.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Product as ProductServiceProduct } from './product.service'; // import Product từ ProductService

export interface Product {
  _id: string;       // luôn bắt buộc
  name: string;
  price: number;
  slug?: string;
  image?: string[];
  viewCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private apiUrl = '/api/favorites';

  private favoritesSubject = new BehaviorSubject<Product[]>([]);
  favorites$ = this.favoritesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFavorites();
  }

  loadFavorites(): void {
    this.http.get<Product[]>(this.apiUrl).subscribe({
      next: products => this.favoritesSubject.next(products),
      error: err => console.error('Lỗi khi load favorites:', err)
    });
  }

  isFavorite(productId?: string): boolean {
    if (!productId) return false;
    return this.favoritesSubject.value.some(p => p._id === productId);
  }

  addFavorite(product: ProductServiceProduct): Observable<Product[]> {
    if (!product._id) throw new Error('Product _id is required');
    return this.http.post<Product[]>(this.apiUrl, { productId: product._id }).pipe(
      tap(() => this.loadFavorites())
    );
  }

  removeFavorite(productId?: string): Observable<Product[]> {
    if (!productId) throw new Error('Product _id is required');
    return this.http.delete<Product[]>(`${this.apiUrl}/${productId}`).pipe(
      tap(() => this.loadFavorites())
    );
  }

  toggleFavorite(product: ProductServiceProduct): Observable<Product[]> {
    if (!product._id) throw new Error('Product _id is required');

    if (this.isFavorite(product._id)) {
      return this.removeFavorite(product._id);
    } else {
      return this.addFavorite(product);
    }
  }

  getFavoritesCount(): Observable<number> {
    return this.favorites$.pipe(map(products => products.length));
  }
}
