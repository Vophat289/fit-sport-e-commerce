import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class DashboardService{
    private apiUrl = '/api/admin/dashboard';

    constructor(private http: HttpClient){ }

    getDashboardData(): Observable<any>{
        return this.http.get<any>(this.apiUrl)
    }
    getTopProducts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/top-products`);
  }
}