// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

interface User {
  _id: string;
  name: string;
  displayName: string;
  email: string;
  role: string;
  isVerified: boolean;
}

interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { name: username, password }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      })
    );
  }
// auth.service.ts
verifyPin(email: string, pin: string): Observable<any> { // ⭐ FIX 1: Thêm email
    // Gửi cả email và pin lên server 
    return this.http.post(`${this.apiUrl}/verify-pin`, { email, pin }); 
}

  register(name: string, email: string, password: string) {
    return this.http.post(`${this.apiUrl}/register`, { name, email, password });
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(pin: string, newPassword: string) {
    return this.http.post(`${this.apiUrl}/reset-password`, { pin, newPassword });
}

logout() {
  return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
    tap(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.currentUserSubject.next(null);
    })
  );
}

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): User | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
