import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '@app/services/cart.service';

@Component({
  selector: 'app-payment-success',
  imports: [CommonModule],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css'
})
export class PaymentSuccessComponent implements OnInit, OnDestroy {

  success = false;
  responseCode = '';
  orderId =  '';
  orderCode = '';
  message = '';
  countdown = 5;
  private countdownInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService
  ){}

  ngOnInit(){
    this.route.queryParams.subscribe(params => {
      // Đọc từ backend redirect (có 'code') hoặc VNPay redirect trực tiếp (có 'vnp_ResponseCode')
      this.responseCode = params['code'] || params['vnp_ResponseCode'] || '';
      this.orderId = params['orderId'] || '';
      this.orderCode = params['orderCode'] || '';
      const method = params['method']; // Đọc phương thức thanh toán

      // ✅ NẾU LÀ COD:
      if (method === 'COD') {
        this.success = true; // COD luôn thành công (vì đã tạo đơn hàng)
        this.message = 'Đặt hàng thành công!';
        this.responseCode = 'COD';
        
        // COD thành công: Xóa cart
        this.clearCartOnSuccess();
      } else {
        // VNPay
        // Kiểm tra success từ params hoặc response code
        this.success = params['success'] === 'true' || this.responseCode === '00';

        if(this.success){
          this.message = 'Thanh toán thành công!';
          // VNPay thành công: Xóa cart
          this.clearCartOnSuccess();
        }else{
          this.message = 'Thanh toán thất bại!';
          // VNPay thất bại: KHÔNG xóa cart (cart đã được khôi phục ở backend)
        }
      }

      // Lưu thông tin vào sessionStorage để hiển thị popup trên trang chủ
      sessionStorage.setItem('paymentResult', JSON.stringify({
        success: this.success,
        responseCode: this.responseCode,
        orderId: this.orderId,
        orderCode: this.orderCode,
        message: this.message
      }));

      // Bắt đầu đếm ngược để tự động redirect
      this.startCountdown();
    });
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown() {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.goToHome();
      }
    }, 1000);
  }

  goToOrders() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.router.navigate(['/account'], { queryParams: { tab: 'orders' } });
  }

  goToHome() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.router.navigate(['/home']);
  }

  closePopup() {
    this.goToHome();
  }

  // Xóa cart chỉ khi thanh toán thành công
  clearCartOnSuccess() {
    try {
      // Xóa selectedCartItems
      localStorage.removeItem('selectedCartItems');
      
      // Xóa giỏ hàng chính (my_cart)
      this.cartService.clearCart();
      
      // Xóa pending order info
      sessionStorage.removeItem('pendingOrderId');
      sessionStorage.removeItem('pendingOrderCode');
      
      console.log('Đã xóa giỏ hàng sau khi thanh toán thành công');
    } catch (error) {
      console.error('Lỗi khi xóa giỏ hàng:', error);
    }
  }
}
