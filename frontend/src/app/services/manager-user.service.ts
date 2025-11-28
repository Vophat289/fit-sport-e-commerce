  import { Injectable } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Observable } from 'rxjs';

  export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    isBlocked: boolean;
    isVerified: boolean;
  }

  @Injectable({
    providedIn: 'root'
  })
  export class UserService {
    private apiUrl = '/api/users';

    constructor(private http: HttpClient) {}

    // Lấy danh sách user
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  blockUser(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/block`, { block: true });
  }

  unblockUser(id: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/block`, { block: false });
  }


  changeRole(id: string, role: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/role`, { role });
  }

  }
