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

interface SessionDataResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface RefreshTokenResponse {
  accessToken: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = '/api/auth';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Kiểm tra và refresh token khi service khởi tạo
    this.checkAndRefreshToken();
  }

login(email: string, password: string) {
  return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
    tap(res => {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      this.currentUserSubject.next(res.user);
    })
  );
}

  // Lấy session data sau OAuth callback (không có token trong URL)
  getSessionData(): Observable<SessionDataResponse> {
    return this.http.get<SessionDataResponse>(`${this.apiUrl}/session-data`, {
      withCredentials: true // Quan trọng: gửi cookies/session
    });
  }

  // Refresh access token bằng refresh token
  refreshAccessToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('Không có refresh token');
    }

    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh-token`, { 
      refreshToken 
    }).pipe(
      tap(res => {
        localStorage.setItem('token', res.accessToken);
      })
    );
  }

  // Kiểm tra và tự động refresh token nếu sắp hết hạn
  private checkAndRefreshToken() {
    const token = this.getToken();
    
    if (!token) return;

    try {
      // Decode JWT để kiểm tra thời gian hết hạn
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;

      // Nếu token sẽ hết hạn trong 5 phút, refresh ngay
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        this.refreshAccessToken().subscribe({
          next: () => console.log('Token đã được làm mới tự động'),
          error: (err) => console.error('Lỗi refresh token:', err)
        });
      }
    } catch (error) {
      console.error('Lỗi decode token:', error);
    }
  }

verifyPin(email: string, pin: string): Observable<any> { 
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
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      this.currentUserSubject.next(null);
    })
  );
}


  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getUser(): User | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(user: User | null) {
  this.currentUserSubject.next(user);
}


  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
