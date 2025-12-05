import { Component } from '@angular/core';
import { CartService } from '@app/services/cart.service';
import { VNPaymentService } from '@app/services/vn_payment.service';


@Component({
  selector: 'app-checkout',
  imports: [],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent {
  
  constructor(
    private vnpaymentService: VNPaymentService,
    private cartService: CartService
  ){}

  // handlePayment(){
  //   const total = this.cartService.getTotalPrice(); //tổng tiền từ Cart
  
      //gọi backend
  //   this.vnpaymentService.createPayment(total).subscribe(res => {
  //     window.location.href = res.paymentUrl; //chuyển ng dùng sang trang VN Pay
  //   });
  // }
}
