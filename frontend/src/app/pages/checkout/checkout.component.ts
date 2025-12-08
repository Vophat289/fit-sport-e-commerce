import { Component, OnInit } from '@angular/core';
import { VNPaymentService } from '@app/services/vn_payment.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService, CartItem } from '@app/services/cart.service';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit{
  receiver_name = '';
  receiver_mobile = '';
  receiver_address = '';
  voucher_code = '';
  
  selectedItems: CartItem[] = [];
  subtotal = 0;
  deliveryFee = 30000;
  voucherDiscount = 0;
  totalAmount = 0;
  loading = false;
  freeShipThreshold = 1000000;

  constructor(
    private vnpaymentService: VNPaymentService,
    private cartService: CartService,
    private http: HttpClient,
    private router: Router
  ){}

  ngOnInit(): void {
    this.loadSelectedItems();
  }

  loadSelectedItems() {
    // Lấy selected items từ localStorage
    const selectedStr = localStorage.getItem('selectedCartItems');
    if (selectedStr) {
      this.selectedItems = JSON.parse(selectedStr);
      this.calculateTotals();
    } else {
      alert('Không có sản phẩm được chọn. Vui lòng quay lại giỏ hàng.');
      this.router.navigate(['/cart']);
    }
  }

  calculateTotals() {
    this.subtotal = this.selectedItems.reduce((sum, item) => {
      return sum + (item.price * (item.quantityToAdd || 1));
    }, 0);

    // Tính phí vận chuyển
    if (this.subtotal === 0) {
      this.deliveryFee = 0;
    } else if (this.subtotal >= this.freeShipThreshold) {
      this.deliveryFee = 0;
    } else {
      this.deliveryFee = 30000;
    }

    this.totalAmount = this.subtotal + this.deliveryFee - this.voucherDiscount;
  }

  handleCheckout() {
    if (!this.receiver_name || !this.receiver_mobile || !this.receiver_address) {
      alert('Vui lòng điền đầy đủ thông tin người nhận');
      return;
    }

    if (!this.selectedItems || this.selectedItems.length === 0) {
      alert('Không có sản phẩm được chọn');
      this.router.navigate(['/cart']);
      return;
    }

    this.loading = true;

    // Bước 1: Sync cart từ localStorage lên backend database
    this.cartService.syncCartToBackend(this.selectedItems).subscribe({
      next: (syncSuccess) => {
        if (!syncSuccess) {
          this.loading = false;
          alert('Lỗi khi đồng bộ giỏ hàng lên server');
          return;
        }

        // Bước 2: Sau khi sync thành công, gọi checkout API
        const checkoutData = {
          receiver_name: this.receiver_name,
          receiver_mobile: this.receiver_mobile,
          receiver_address: this.receiver_address,
          voucher_code: this.voucher_code || null
        };

        this.http.post('/api/cart/checkout', checkoutData).subscribe({
          next: (response: any) => {
            this.loading = false;
            if (response.success && response.paymentUrl) {
              // Xóa selected items và localStorage cart sau khi checkout thành công
              localStorage.removeItem('selectedCartItems');
              // Redirect đến VNPay
              window.location.href = response.paymentUrl;
            } else {
              alert('Lỗi khi tạo thanh toán');
            }
          },
          error: (err) => {
            this.loading = false;
            console.error('❌ Lỗi checkout:', err);
            console.error('❌ Error details:', {
              status: err.status,
              message: err.error?.message,
              error: err.error?.error,
              details: err.error?.details
            });
            const errorMsg = err.error?.message || err.error?.error || 'Lỗi khi xử lý thanh toán';
            alert(errorMsg);
          }
        });
      },
      error: (syncError) => {
        this.loading = false;
        console.error('Lỗi sync cart:', syncError);
        alert(syncError.error?.message || 'Lỗi khi đồng bộ giỏ hàng. Vui lòng thử lại.');
      }
    });
  }

  // handlePayment(){
  //   const total = this.cartService.getTotalPrice(); //tổng tiền từ Cart
  
  //     // gọi backend
  //   this.vnpaymentService.createPayment(total).subscribe(res => {
  //     window.location.href = res.paymentUrl; //chuyển ng dùng sang trang VN Pay
  //   });
  // }
}
