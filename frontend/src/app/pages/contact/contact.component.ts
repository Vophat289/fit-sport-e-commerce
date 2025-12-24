import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);
  private router = inject(Router);

  businessName = 'FITSPORT';
  address = 'cầu vượt Quang Trung, Gò Vấp, TP. HCM';

  // Link Google Maps nhúng chính xác khu vực FITSPORT
  safeMapUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.7230230282126!2d106.6713872!3d10.8413476!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752981d11b3053%3A0x6b9076f7b158c38c!2zQyauG6p3IHRyxI0gUXVhbmcsIEdhu5kgVuG6p3AsIEjhu5MgQ2jDrSBNaW5o!5e0!3m2!1svi!2s!4v1731999999999!5m2!1svi!2s'
  );

  contactForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^0\d{9}$/)]], // 10 số, bắt đầu bằng 0
    content: ['', Validators.required]
  });

  showSuccessMessage = signal(false);
  isSubmitting = signal(false);
  showErrorMessage = signal(false);

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.showErrorMessage.set(false);

    const payload = {
      ...this.contactForm.value,
      business: this.businessName,
      submittedAt: new Date().toISOString()
    };

    // Gửi đến backend - không cần đăng nhập
    this.http.post('/api/contact', payload).subscribe({
      next: (response: any) => {
        this.isSubmitting.set(false);
        this.showSuccessMessage.set(true);
        console.log('Gửi liên hệ thành công:', response);
      },
      error: (error: any) => {
        this.isSubmitting.set(false);
        this.showErrorMessage.set(true);
        console.error('Lỗi gửi liên hệ:', error);
        
        // Hiển thị thông báo lỗi chi tiết nếu có
        if (error.error?.message) {
          alert(error.error.message);
        }
      }
    });
  }

  goToHomePage(): void {
    this.router.navigate(['/']); // Dùng Angular Router thay vì reload
  }

  resetForm(): void {
    this.showSuccessMessage.set(false);
    this.contactForm.reset();
    this.contactForm.markAsUntouched();
  }
}