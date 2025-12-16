import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    let clonedReq = req;
    if (token) {
      clonedReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });
    }

    return next.handle(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Xử lý tài khoản bị chặn
        if (
          error.status === 403 &&
          error.error?.message?.toLowerCase().includes('bị chặn')
        ) {
          this.toastr.error('Tài khoản của bạn đã bị chặn. Vui lòng liên hệ quản trị viên.');

          this.authService.logout().subscribe({
            next: () => {
              this.router.navigate(['/login']);
            },
            error: () => {
              this.router.navigate(['/login']);
            }
          });

          return throwError(() => error);
        }

        // Xử lý token hết hạn - tự động refresh
        if (error.status === 401 && error.error?.message?.includes('hết hạn')) {
          return this.handle401Error(clonedReq, next);
        }

        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshAccessToken().pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.accessToken);
          
          // Retry request với token mới
          const newRequest = request.clone({
            headers: request.headers.set('Authorization', `Bearer ${response.accessToken}`)
          });
          
          return next.handle(newRequest);
        }),
        catchError((err) => {
          this.isRefreshing = false;
          
          // Refresh token cũng hết hạn - yêu cầu đăng nhập lại
          this.toastr.warning('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
          this.authService.logout().subscribe(() => {
            this.router.navigate(['/login']);
          });
          
          return throwError(() => err);
        })
      );
    } else {
      // Chờ refresh token hoàn thành
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(jwt => {
          const newRequest = request.clone({
            headers: request.headers.set('Authorization', `Bearer ${jwt}`)
          });
          return next.handle(newRequest);
        })
      );
    }
  }
}
