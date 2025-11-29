import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type AdminThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class AdminThemeService {
  private readonly storageKey = 'fit-admin-theme';
  private readonly themeSubject = new BehaviorSubject<AdminThemeMode>(this.loadStoredTheme());
  private isAttachedToBody = false;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  /**
   * Observable stream để UI có thể lắng nghe state theme hiện tại.
   */
  readonly currentTheme$ = this.themeSubject.asObservable();

  /**
   * Lấy theme hiện tại (sử dụng khi không cần subscribe).
   */
  get currentTheme(): AdminThemeMode {
    return this.themeSubject.value;
  }

  /**
   * Gắn class theme vào <body> khi admin layout được render.
   */
  attach(): void {
    if (this.isAttachedToBody) {
      // Đảm bảo class đúng even khi attach lại (ví dụ hot reload)
      this.applyThemeClasses(this.themeSubject.value);
      return;
    }

    this.isAttachedToBody = true;
    this.applyThemeClasses(this.themeSubject.value);
  }

  /**
   * Gỡ class theme khỏi <body> khi rời admin layout.
   */
  detach(): void {
    if (!this.isAttachedToBody) {
      return;
    }

    this.isAttachedToBody = false;
    const classList = this.document.body.classList;
    classList.remove('admin-theme', 'admin-theme-dark', 'admin-theme-light');
  }

  /**
   * Chuyển qua lại giữa dark/light mode.
   */
  toggleTheme(): void {
    const nextTheme: AdminThemeMode = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  /**
   * Set theme cụ thể và persist xuống localStorage.
   */
  setTheme(theme: AdminThemeMode): void {
    if (this.themeSubject.value === theme) {
      // Vẫn cần apply classes đề phòng detach/attach nhanh.
      if (this.isAttachedToBody) {
        this.applyThemeClasses(theme);
      }
      return;
    }

    this.themeSubject.next(theme);
    this.persistTheme(theme);

    if (this.isAttachedToBody) {
      this.applyThemeClasses(theme);
    }
  }

  private applyThemeClasses(theme: AdminThemeMode): void {
    const classList = this.document.body.classList;
    classList.add('admin-theme');
    classList.remove('admin-theme-dark', 'admin-theme-light');
    classList.add(`admin-theme-${theme}`);
  }

  private loadStoredTheme(): AdminThemeMode {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    const stored = window.localStorage.getItem(this.storageKey) as AdminThemeMode | null;
    return stored === 'light' ? 'light' : 'dark';
  }

  private persistTheme(theme: AdminThemeMode): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(this.storageKey, theme);
  }
}

