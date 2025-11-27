// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { ClientLayoutComponent } from './components/client-layout/client-layout.component';
import { HomeComponent } from './components/home/home.component';
import { HomeCategoryComponent } from './components/home-category/home-category.component';
import { ProductPageComponent } from './pages/product-page/product-page.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { GioiThieuComponent } from './pages/gioi-thieu/gioi-thieu.component';
import { AccountPageComponent } from './pages/account-page/account-page.component';
import { ContactComponent } from './pages/contact/contact.component';
import { VoucherComponent } from './pages/voucher/voucher.component';

// Auth pages
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { VerifyPinComponent } from './pages/verify-pin/verify-pin.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';

// Admin routes 
import { AdminRoutes } from './admin/admin.routes';

export const routes: Routes = [
  {
    path: '',
    component: ClientLayoutComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'category/:slug', component: HomeCategoryComponent },

      // Danh sách sản phẩm
      { path: 'products', component: ProductPageComponent },
      { path: 'products/category/:slug', component: ProductPageComponent },
      { path: 'products/:slug', component: ProductDetailComponent },

      // Trang tĩnh
      { path: 'gioi-thieu', component: GioiThieuComponent },
      { path: 'account', component: AccountPageComponent },
      { path: 'contact', component: ContactComponent },
      { path: 'voucher', component: VoucherComponent },

      // Tin tức
      { path: 'news', loadComponent: () => import('./pages/news/news.component').then(c => c.NewsComponent) },
      { path: 'news/:slug', loadComponent: () => import('./components/news-detail/news-detail.component').then(c => c.NewsDetailComponent) },

      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'verify-pin', component: VerifyPinComponent },
      { path: 'reset-password', component: ResetPasswordComponent },


      { path: '', redirectTo: '/home', pathMatch: 'full' },
    ]
  },

  ...AdminRoutes,

  { path: '**', redirectTo: '/home' }
];