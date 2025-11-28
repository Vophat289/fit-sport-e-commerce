// src/app/services/admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface đơn giản cho dữ liệu cơ bản (ID và Name)
export interface ProductBasic {
    _id: string;
    name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
    private apiUrl = 'http://localhost:3000/api/admin';

    constructor(private http: HttpClient) { }
    
    // ======================================================
    // ✅ 1. PRODUCT BASIC (Lấy danh sách sản phẩm cho Seeder)
    // ======================================================
    /**
     * Tải danh sách ID và Tên của tất cả sản phẩm (GET /api/admin/products-basic)
     */
    getAllProductsBasic(): Observable<ProductBasic[]> {
        return this.http.get<ProductBasic[]>(`${this.apiUrl}/products-basic`);
    }
    // ======================================================

    // --- SIZE ---
    addSize(name: string): Observable<any> {
        // POST /api/admin/sizes
        return this.http.post(`${this.apiUrl}/sizes`, { name });
    }
    getAllSizes(): Observable<any> {
        // GET /api/admin/sizes
        return this.http.get(`${this.apiUrl}/sizes`);
    }

    // --- COLOR ---
    addColor(name: string, hex_code: string): Observable<any> {
        // POST /api/admin/colors
        return this.http.post(`${this.apiUrl}/colors`, { name, hex_code });
    }
    getAllColors(): Observable<any> {
        // GET /api/admin/colors
        return this.http.get(`${this.apiUrl}/colors`);
    }

    // --- VARIANT ---
    addProductVariant(payload: any): Observable<any> {
        // POST /api/admin/variants
        return this.http.post(`${this.apiUrl}/variants`, payload);
    }
}