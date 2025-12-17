import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
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
        if (
          error.status === 403 &&
          error.error?.message?.toLowerCase().includes('bị chặn')
        ) {
          this.toastr.error('Tài khoản của bạn đã bị chặn. Vui lòng liên hệ quản trị viên.');

          // Thực hiện logout và subscribe để chắc chắn chạy
          this.authService.logout().subscribe({
            next: () => {
              this.router.navigate(['/login']);
            },
            error: () => {
              // Nếu logout lỗi, vẫn điều hướng về login
              this.router.navigate(['/login']);
            }
          });

          // Trả về lỗi tiếp tục xử lý downstream nếu cần
          return throwError(() => error);
        }
        return throwError(() => error);
      })
    );
  }
}
