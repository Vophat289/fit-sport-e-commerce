import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  CartService,
  CartItem,
  CartDetails,
  AddCartPayload,
} from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.css'],
})
export class CartPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  cartData: CartDetails | null = null;
  cartItems: CartItem[] = [];

  subtotal = 0;
  totalAmount = 0;
  deliveryFee = 0;
  voucherDiscount = 0;

  freeShipThreshold = 1000000;
  voucherCode = '';

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // if (!this.authService.isLoggedIn()) {
    //   this.router.navigate(['/login']);
    //   return;
    // }
    this.loadCart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByItem(index: number, item: CartItem) {
    return item._id;
  }

  get allItemsSelected(): boolean {
    return (
      this.cartItems.length > 0 && this.cartItems.every((i) => !!i.selected)
    );
  }

  toggleSelectAll(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.cartItems.forEach((item) => (item.selected = isChecked));
    this.calculateTotals();
  }

  toggleItemSelection(item: CartItem, event: Event): void {
    item.selected = (event.target as HTMLInputElement).checked;
    this.calculateTotals();
  }

  loadCart(): void {
    this.cartService
      .getCartDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: CartDetails) => {
        this.cartData = data;
        this.cartItems = (data.items || []).map((item) => ({
          ...item,
          selected: false,
          sizeName: item.sizeName || '—',
          colorName: item.colorName || '—',
          stock: item.stock ?? 0,
          quantityToAdd: item.quantityToAdd ?? 1,
          maxStock: item.stock ?? 0,
        }));
        console.log('Cart loaded:', this.cartItems);
        this.calculateTotals();
      });
  }

  calculateTotals(): void {
    const selected = this.cartItems.filter((i) => i.selected);
    this.subtotal = selected.reduce((s, i) => s + i.price * i.quantityToAdd, 0);

    // Nếu subtotal = 0 → miễn phí (không có sản phẩm)
    // Nếu subtotal >= freeShipThreshold → miễn phí
    // Ngược lại → 30.000
    if (this.subtotal === 0) {
      this.deliveryFee = 0;
    } else if (this.subtotal >= this.freeShipThreshold) {
      this.deliveryFee = 0;
    } else {
      this.deliveryFee = 30000;
    }

    this.totalAmount = this.subtotal + this.deliveryFee - this.voucherDiscount;
  }

  handleAddToCart(
    productId: string,
    sizeId: string = '',
    colorId: string = '',
    quantity: number = 1,
    name: string = '',
    price: number = 0,
    image: string = '',
    sizeName: string = '—',
    colorName: string = '—',
    maxStock: number = 99
  ): void {
    // Tìm item đã tồn tại trong giỏ
    const existingItem = this.cartItems.find(
      (i) =>
        i.variant_id === productId &&
        i.sizeId === sizeId &&
        i.colorId === colorId
    );
    const currentQty = existingItem ? existingItem.quantityToAdd : 0;
    const allowedQty = maxStock - currentQty;

    // Kiểm tra tồn kho
    if (allowedQty <= 0) {
      alert('Sản phẩm này đã hết tồn kho.');
      return;
    }

    if (quantity > allowedQty) {
      alert(`Chỉ còn ${allowedQty} sản phẩm có thể thêm.`);
      quantity = allowedQty;
    }

    // đảm bảo image là string hợp lệ
    const finalImage = image || 'assets/images/placeholder.jpg';

    const payload: AddCartPayload = {
      productId,
      name,
      price,
      image: finalImage,
      sizeId,
      sizeName: sizeName || '—',
      colorId,
      colorName: colorName || '—',
      quantityToAdd: quantity,
      stock: maxStock,
    };

    this.cartService.addToCart(payload).subscribe({
      next: () => {
        alert(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
        this.loadCart();
      },
      error: (err) => {
        console.error('Thêm vào giỏ hàng thất bại:', err);
        alert('Thêm vào giỏ hàng thất bại.');
      },
    });
  }

  updateQuantity(itemId: number | undefined, quantityInput: number) {
    if (itemId === undefined) return;

    const idx = this.cartItems.findIndex((i) => i._id === itemId);
    if (idx === -1) return;

    const currentItem = this.cartItems[idx];
    const maxStock = currentItem.stock ?? 0;

    let newQuantity = Number(quantityInput);
    if (isNaN(newQuantity) || newQuantity < 0) newQuantity = 0;

    if (newQuantity > maxStock) {
      alert(`Chỉ còn ${maxStock} sản phẩm trong kho.`);
      newQuantity = maxStock;
    }

    if (newQuantity === 0) {
      if (confirm(`Bạn có muốn xóa "${currentItem.name}" khỏi giỏ hàng?`)) {
        this.deleteItem(itemId);
      }
      return;
    }

    currentItem.quantityToAdd = newQuantity;
    this.calculateTotals();

    this.cartService.updateCartItem(itemId, newQuantity).subscribe({
      next: () => {},
      error: (err) => {
        alert('Cập nhật thất bại!');
        this.loadCart();
      },
    });
  }

  deleteItem(itemId: number | undefined): void {
    if (itemId === undefined) return;
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    this.cartService.deleteCartItem(itemId).subscribe({
      next: () => this.loadCart(),
      error: (err) => {
        console.error('Xóa thất bại', err);
        alert('Xóa thất bại!');
      },
    });
  }

  applyVoucher(): void {
    const code = this.voucherCode.trim().toUpperCase();
    if (code === 'FSDISCOUNT') {
      this.voucherDiscount = Math.round(this.subtotal * 0.05);
      alert('Áp dụng mã thành công!');
    } else {
      this.voucherDiscount = 0;
      alert('Mã giảm giá không hợp lệ!');
    }
    this.calculateTotals();
  }

  proceedToCheckout(): void {
    const selected = this.cartItems.filter((i) => i.selected);
    if (selected.length === 0) {
      alert('Chọn ít nhất 1 sản phẩm để thanh toán.');
      return;
    }
    // Lưu selected items vào localStorage để checkout có thể lấy
    localStorage.setItem('selectedCartItems', JSON.stringify(selected));
      // Lưu thông tin voucher
    localStorage.setItem('appliedVoucher', JSON.stringify({
      code: this.voucherCode,
      discount: this.voucherDiscount
    }));
      // Lưu tổng cộng (tạm tính + phí vận chuyển - voucher)
    localStorage.setItem('checkoutTotal', JSON.stringify(this.totalAmount));
    if (!this.authService.isLoggedIn()) {
    localStorage.setItem('afterLoginRedirect', '/checkout');
    this.router.navigate(['/login']);
    return;
  }
    this.router.navigate(['/checkout']);
  }
  deleteSelectedItems(): void {
    const selectedItems = this.cartItems.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      alert('Chọn ít nhất 1 sản phẩm để xóa.');
      return;
    }

    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa ${selectedItems.length} sản phẩm đã chọn?`
      )
    )
      return;

    // Dùng Promise.all để xóa tất cả
    const deleteObservables = selectedItems.map((item) =>
      this.cartService.deleteCartItem(item._id)
    );

    Promise.all(deleteObservables.map((obs) => obs.toPromise()))
      .then(() => {
        alert('Đã xóa các sản phẩm đã chọn!');
        this.loadCart();
      })
      .catch((err) => {
        console.error('Xóa thất bại', err);
        alert('Xóa thất bại!');
      });
  }
}
