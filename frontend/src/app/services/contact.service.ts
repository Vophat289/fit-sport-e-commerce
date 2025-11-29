import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root' // 👈 service có thể inject toàn app
})
export class ContactService {
  private apiUrl = 'http://localhost:3000/api/admin/contacts';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token') || '';
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  // Lấy danh sách contact
  getContacts(page: number, limit: number, search: string): Observable<any> {
    const url = `${this.apiUrl}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
    return this.http.get<any>(url, this.getAuthHeaders());
  }

  // Ẩn/hiện contact
  toggleVisibility(id: string): Observable<any> {
    const url = `${this.apiUrl}/${id}/toggle`;
    return this.http.patch<any>(url, {}, this.getAuthHeaders());
  }
}
