// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

export interface AddCartPayload {
  productId: string;
  name: string;
  price: number;
  image: string;
  sizeId?: string;
  sizeName?: string;
  colorId?: string;
  colorName?: string;
  quantity: number;
}

export interface CartItem {
  _id: number;
  variant_id: string;
  name: string;
  price: number;
  image: string;
  sizeId?: string;
  sizeName?: string;
  colorId?: string;
  colorName?: string;
  quantity: number;
  maxStock?: number;
  selected?: boolean;
}

export interface CartDetails {
  cartId?: string;
  items: CartItem[];
  totalAmount?: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private storageKey = 'my_cart';

  // BehaviorSubject lưu trữ số lượng sản phẩm
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  constructor() {
    this.updateCartCount(); // Khởi tạo số lượng khi load service
  }

  // Lấy cart từ localStorage
  private getLocalCart(): CartDetails {
    const local = localStorage.getItem(this.storageKey);
    if (local) return JSON.parse(local);
    return { cartId: 'local', items: [] };
  }

  // Lưu cart và cập nhật cartCount
  private saveLocalCart(cart: CartDetails) {
    localStorage.setItem(this.storageKey, JSON.stringify(cart));
    this.updateCartCount();
  }

  // Cập nhật tổng số lượng giỏ hàng
  private updateCartCount() {
    const cart = this.getLocalCart();
    const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    this.cartCountSubject.next(count);
  }

  // Lấy chi tiết giỏ hàng
  getCartDetails(): Observable<CartDetails> {
    return new Observable<CartDetails>((subscriber) => {
      const cart = this.getLocalCart();
      subscriber.next(cart);
      subscriber.complete();
    });
  }

  // Thêm sản phẩm vào giỏ
  addToCart(payload: AddCartPayload): Observable<{ cart: CartDetails }> {
    return new Observable<{ cart: CartDetails }>((subscriber) => {
      const cart = this.getLocalCart();

      const idx = cart.items.findIndex(
        (i) =>
          i.variant_id === payload.productId &&
          i.sizeId === (payload.sizeId || '') &&
          i.colorId === (payload.colorId || '')
      );

      if (idx > -1) {
        cart.items[idx].quantity += payload.quantity;
      } else {
        cart.items.push({
          _id: Date.now(),
          variant_id: payload.productId,
          name: payload.name,
          price: payload.price,
          image: payload.image,
          sizeId: payload.sizeId || undefined,
          sizeName: payload.sizeName || '—',
          colorId: payload.colorId || undefined,
          colorName: payload.colorName || '—',
          quantity: payload.quantity,
          selected: true,
        });
      }

      this.saveLocalCart(cart); // ✅ tự động cập nhật cartCount
      subscriber.next({ cart });
      subscriber.complete();
    });
  }

  // Cập nhật số lượng sản phẩm
  updateCartItem(itemId: number, quantity: number): Observable<CartDetails> {
    return new Observable<CartDetails>((subscriber) => {
      const cart = this.getLocalCart();
      const idx = cart.items.findIndex((i) => i._id === itemId);
      if (idx > -1) cart.items[idx].quantity = quantity;
      this.saveLocalCart(cart); // ✅ tự động cập nhật cartCount
      subscriber.next(cart);
      subscriber.complete();
    });
  }

  // Xóa sản phẩm
  deleteCartItem(itemId: number): Observable<CartDetails> {
    return new Observable<CartDetails>((subscriber) => {
      const cart = this.getLocalCart();
      cart.items = cart.items.filter((i) => i._id !== itemId);
      this.saveLocalCart(cart); // ✅ tự động cập nhật cartCount
      subscriber.next(cart);
      subscriber.complete();
    });
  }

  // Xóa toàn bộ giỏ
  clearCart(): void {
    localStorage.removeItem(this.storageKey);
    this.cartCountSubject.next(0); // ✅ reset số lượng
  }
}
