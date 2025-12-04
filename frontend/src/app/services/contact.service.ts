import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  // === ĐÚNG URL BACKEND CỦA ÔNG CHỦ ===
  private apiUrl = 'http://localhost:3000/api/admin/contacts';

  constructor(private http: HttpClient) {}

  // Tạo headers có Bearer token
  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token') || '';
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  // ===============================
  // 1️⃣ GET: Lấy danh sách contact
  // ===============================
  getContacts(page: number, limit: number, search: string): Observable<any> {
    const url = `${this.apiUrl}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
    return this.http.get<any>(url, this.getAuthHeaders());
  }

  // ===============================
  // 2️⃣ PATCH: Ẩn/Hiện contact
  // ===============================
  toggleVisibility(id: string): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/${id}/toggle`,
      {},
      this.getAuthHeaders()
    );
  }

  // ===============================
  // 3️⃣ DELETE: Xoá contact
  // ===============================
  deleteContact(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${id}`,
      this.getAuthHeaders()
    );
  }

  // ===============================
  // 4️⃣ GET: Lấy chi tiết contact
  // ===============================
  getContactById(id: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${id}`,
      this.getAuthHeaders()
    );
  }

  // ===============================
  // 5️⃣ POST: Tạo contact (nếu cần test)
  // ===============================
  createContact(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl,
      data,
      this.getAuthHeaders()
    );
  }
}
