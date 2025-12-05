import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  imports: [],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css'
})
export class PaymentSuccessComponent implements OnInit{

  
  success = false;
  responseCode = '';

  constructor(
    private route: ActivatedRoute,
  ){}

  ngOnInit(){
    this.route.queryParams.subscribe(params => {
      this.responseCode = params['vnp_ResponseCode'];

      //00 là thanh toán thành công 
      this.success = this.responseCode === '00';
    })
  }
}
