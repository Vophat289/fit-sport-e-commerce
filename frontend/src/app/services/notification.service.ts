import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private toastr: ToastrService) {}

  /**
   * Hiển thị thông báo thành công
   */
  success(message: string, title: string = 'Thành công'): void {
       this.toastr.success(
      `<div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>`,
      '',
      {
        timeOut: 3000,
        positionClass: 'toast-top-right',
        closeButton: true,
        progressBar: true,
        enableHtml: true,
        tapToDismiss: true
      }
    );
  }

  /**
   * Hiển thị thông báo lỗi
   */
  error(message: string, title: string = 'Lỗi'): void {
    this.toastr.error(
      `<div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>`,
      '',
      {
        timeOut: 4000,
        positionClass: 'toast-top-right',
        closeButton: true,
        progressBar: true,
        enableHtml: true,
        tapToDismiss: true
      }
    );
  }

  /**
   * Hiển thị thông báo cảnh báo
   */
  warning(message: string, title: string = 'Cảnh báo'): void {
    this.toastr.warning(
      `<div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>`,
      '',
      {
        timeOut: 3500,
        positionClass: 'toast-top-right',
        closeButton: true,
        progressBar: true,
        enableHtml: true,
        tapToDismiss: true
      }
    );
  }

  /**
   * Hiển thị thông báo thông tin
   */
  info(message: string, title: string = 'Thông tin'): void {
    this.toastr.info(
      `<div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>`,
      '',
      {
        timeOut: 3000,
        positionClass: 'toast-top-right',
        closeButton: true,
        progressBar: true,
        enableHtml: true,
        tapToDismiss: true
      }
    );
  }

  /**
   * Hiển thị dialog xác nhận (thay thế confirm)
   */
  async confirm(
    message: string,
    title: string = 'Xác nhận',
    confirmText: string = 'Xác nhận',
    cancelText: string = 'Hủy',
    icon: 'warning' | 'question' | 'info' | 'error' = 'question'
  ): Promise<boolean> {
    const result = await Swal.fire({
      title: title,
      text: message,
      icon: icon,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: 'transparent', // Dùng transparent để CSS custom hoạt động
      cancelButtonColor: 'transparent', // Dùng transparent để CSS custom hoạt động
      reverseButtons: true,
      customClass: {
        popup: 'swal2-popup-modern',
        confirmButton: 'swal2-confirm-modern',
        cancelButton: 'swal2-cancel-modern'
      },
      buttonsStyling: false, // Tắt styling mặc định để dùng CSS custom
      allowOutsideClick: true,
      allowEscapeKey: true,
      allowEnterKey: true,
      focusConfirm: false,
      focusCancel: false,
      showCloseButton: false,
      timer: undefined, // Không tự đóng theo timer
      timerProgressBar: false
    });

    return result.isConfirmed;
  }

  /**
   * Hiển thị dialog xác nhận xóa
   */
  async confirmDelete(itemName?: string): Promise<boolean> {
    const message = itemName 
      ? `Bạn có chắc chắn muốn xóa "${itemName}"?`
      : 'Bạn có chắc chắn muốn xóa?';
    
    return this.confirm(
      message,
      'Xác nhận xóa',
      'Xóa',
      'Hủy',
      'warning'
    );
  }

  /**
   * Hiển thị dialog xác nhận với nút nguy hiểm (màu đỏ)
   */
  async confirmDanger(
    message: string,
    title: string = 'Xác nhận',
    confirmText: string = 'Xác nhận',
    cancelText: string = 'Hủy'
  ): Promise<boolean> {
    const result = await Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: 'transparent', // Dùng transparent để CSS custom hoạt động
      cancelButtonColor: 'transparent', // Dùng transparent để CSS custom hoạt động
      reverseButtons: true,
      customClass: {
        popup: 'swal2-popup-modern',
        confirmButton: 'swal2-confirm-danger',
        cancelButton: 'swal2-cancel-modern'
      },
      buttonsStyling: false, // Tắt styling mặc định để dùng CSS custom
      allowOutsideClick: true,
      allowEscapeKey: true,
      allowEnterKey: true,
      focusConfirm: false,
      focusCancel: false,
      showCloseButton: false,
      timer: undefined, // Không tự đóng theo timer
      timerProgressBar: false
    });

    return result.isConfirmed;
  }
}

