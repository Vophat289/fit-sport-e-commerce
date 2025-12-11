// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface AddCartPayload {
  productId: string;
  name: string;
  price: number;
  image: string;
  sizeId?: string;
  sizeName?: string;
  colorId?: string;
  colorName?: string;
  quantityToAdd: number; // số lượng user muốn đặt
  stock?: number; // tồn kho thực tế từ dữ liệu sản phẩm
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
  quantityToAdd: number;
  maxStock?: number;
  selected?: boolean;
     
  stock: number;
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
  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.updateCartCount();
  }

  private getLocalCart(): CartDetails {
    const local = localStorage.getItem(this.storageKey);
    if (local) return JSON.parse(local);
    return { cartId: 'local', items: [] };
  }

  private saveLocalCart(cart: CartDetails) {
    localStorage.setItem(this.storageKey, JSON.stringify(cart));
    this.updateCartCount();
  }

  private updateCartCount() {
    const cart = this.getLocalCart();
    const count = cart.items.reduce((sum, item) => sum + (item.quantityToAdd || 0), 0);
    console.log('Update cart count:', {
      itemsCount: cart.items.length,
      totalQuantity: count,
      items: cart.items.map(i => ({ name: i.name, qty: i.quantityToAdd }))
    });
    this.cartCountSubject.next(count);
  }

  getCartDetails(): Observable<CartDetails> {
    return new Observable<CartDetails>((subscriber) => {
      subscriber.next(this.getLocalCart());
      subscriber.complete();
    });
  }

  addToCart(payload: AddCartPayload): Observable<{ cart: CartDetails }> {
    return new Observable<{ cart: CartDetails }>((subscriber) => {
      const cart = this.getLocalCart();

      // Chuẩn hóa sizeId và colorId để so sánh đúng (undefined, null, '' đều được xử lý giống nhau)
      const normalizeId = (id: string | undefined | null): string => {
        return (id || '').trim();
      };

      const payloadSizeId = normalizeId(payload.sizeId);
      const payloadColorId = normalizeId(payload.colorId);

      const idx = cart.items.findIndex(
        (i) =>
          i.variant_id === payload.productId &&
          normalizeId(i.sizeId) === payloadSizeId &&
          normalizeId(i.colorId) === payloadColorId
      );

      if (idx > -1) {
        const currentQty = cart.items[idx].quantityToAdd ?? 0;
        const maxStock = payload.stock ?? cart.items[idx].stock ?? 0;
        const newQty = currentQty + payload.quantityToAdd;

        cart.items[idx].quantityToAdd = newQty > maxStock ? maxStock : newQty;
        cart.items[idx].stock = maxStock; // giữ tồn kho gốc
      } else {
        // Thêm item mới
        cart.items.push({
          _id: Date.now(),
          variant_id: payload.productId,
          name: payload.name,
          price: payload.price,
          image: payload.image,
          sizeId: payloadSizeId || undefined, // Lưu normalized value
          sizeName: payload.sizeName || '—',
          colorId: payloadColorId || undefined, // Lưu normalized value
          colorName: payload.colorName || '—',
          quantityToAdd: payload.quantityToAdd,
          stock: payload.stock ?? payload.quantityToAdd, // tồn kho thực tế
          selected: true,
        });
      }

      this.saveLocalCart(cart);
      console.log('Cart sau khi thêm:', {
        totalItems: cart.items.length,
        totalQuantity: cart.items.reduce((sum, item) => sum + (item.quantityToAdd || 0), 0),
        items: cart.items.map(i => ({ name: i.name, qty: i.quantityToAdd }))
      });
      subscriber.next({ cart });
      subscriber.complete();
    });
  }

  // Cập nhật số lượng sản phẩm
  updateCartItem(itemId: number, quantity: number): Observable<CartDetails> {
    return new Observable<CartDetails>((subscriber) => {
      const cart = this.getLocalCart();
      const idx = cart.items.findIndex((i) => i._id === itemId);
      if (idx > -1) {
        const maxStock = cart.items[idx].stock ?? quantity;
        cart.items[idx].quantityToAdd =
          quantity > maxStock ? maxStock : quantity;
      }
      this.saveLocalCart(cart);
      subscriber.next(cart);
      subscriber.complete();
    });
  }

  // Xóa sản phẩm
  deleteCartItem(itemId: number): Observable<CartDetails> {
    return new Observable<CartDetails>((subscriber) => {
      const cart = this.getLocalCart();
      cart.items = cart.items.filter((i) => i._id !== itemId);
      this.saveLocalCart(cart);
      subscriber.next(cart);
      subscriber.complete();
    });
  }

  // Xóa toàn bộ giỏ
  clearCart(): void {
    localStorage.removeItem(this.storageKey);
    this.cartCountSubject.next(0);
  }

  // Refresh cart count từ localStorage
  refreshCartCount(): void {
    this.updateCartCount();
  }

  getCart(): Observable<any> {
    return this.http.get<any>('/api/cart');
  }
applyVoucher(code: string, subtotal: number) {
  return this.http.post<{ code: string; discount: number }>(
    'http://localhost:3000/api/voucher/apply',
    { code, subtotal }
  );
}


  // Sync cart từ localStorage lên backend
  syncCartToBackend(selectedItems: CartItem[]): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      if (!selectedItems || selectedItems.length === 0) {
        subscriber.next(true);
        subscriber.complete();
        return;
      }

      // Chuyển đổi selectedItems sang format backend cần
      const syncItems = selectedItems.map(item => ({
        productId: item.variant_id,
        sizeId: item.sizeId || '',
        colorId: item.colorId || '',
        quantity: item.quantityToAdd || 1
      }));

      // Gọi endpoint sync để SET quantity chính xác
      this.http.post('/api/cart/sync', { items: syncItems }).subscribe({
        next: () => {
          console.log('Sync cart to backend thành công:', selectedItems.length, 'items');
          subscriber.next(true);
          subscriber.complete();
        },
        error: (error) => {
          console.error('Lỗi khi sync cart:', error);
          subscriber.error(error);
        }
      });
    });
  }
}
