import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-success',
  imports: [CommonModule],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css'
})
export class PaymentSuccessComponent implements OnInit{

  success = false;
  responseCode = '';
  orderId =  '';
  orderCode = '';
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ){}

  ngOnInit(){
    console.log('=== Payment Success Component Init ===');
    this.route.queryParams.subscribe(params => {
      console.log('Query params received:', params);
      
      // Đọc từ backend redirect (có 'code') hoặc VNPay redirect trực tiếp (có 'vnp_ResponseCode')
      this.responseCode = params['code'] || params['vnp_ResponseCode'] || '';
      this.orderId = params['orderId'] || '';
      this.orderCode = params['orderCode'] || '';
      
      console.log('Parsed values:', {
        responseCode: this.responseCode,
        orderId: this.orderId,
        orderCode: this.orderCode
      });
      
      // Kiểm tra success từ params hoặc response code
      this.success = params['success'] === 'true' || this.responseCode === '00';

      console.log('Payment success:', this.success);

      if(this.success){
        this.message = 'Thanh toán thành công';
      }else{
        this.message = 'Thanh toán thất bại';
      }
      
      console.log('Final state:', {
        success: this.success,
        message: this.message,
        responseCode: this.responseCode
      });
    });
  }

  goToOrders() {
    this.router.navigate(['/account'], { queryParams: { tab: 'orders' } });
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
}
