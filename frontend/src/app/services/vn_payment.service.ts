import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VNPaymentService{
    private api = '/api/vnpay';

    constructor(private http: HttpClient){}

    createPayment(amount: number): Observable<{ paymentUrl: string }>{
        return this.http.post<{ paymentUrl: string}>(
            `${this.api}/create-payment`, {amount}
        );
    }
}