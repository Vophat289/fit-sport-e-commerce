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
import { CartPageComponent } from './pages/cart-page/cart-page.component';
import { DataSeederComponent } from './pages/admin-seeder/data-seeder.component';
import { NewsComponent } from './pages/news/news.component';
import { NewsDetailComponent } from './components/news-detail/news-detail.component';

// Auth pages
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { VerifyPinComponent } from './pages/verify-pin/verify-pin.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { AuthCallbackComponent } from './pages/auth-callback/auth-callback.component';
import { FavoriteComponent } from './pages/favorite/favorite.component';
// Admin routes 
import { AdminRoutes } from './admin/admin.routes';
import { PaymentSuccessComponent } from './pages/payment-success/payment-success.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';

export const routes: Routes = [
  {
    path: '', // Route cha không có path, để các route con tự quy định path
    component: ClientLayoutComponent, 
    children: [
      // Routes hiển thị bên trong ClientLayoutComponent
      { path: 'home', component: HomeComponent }, 
      { path: 'category/:slug', component: HomeCategoryComponent },
      { path: 'products', component: ProductPageComponent }, 
      { path: 'products/:slug', component: ProductDetailComponent }, 
      { path: 'products/category/:slug', component: ProductPageComponent },
      { path: 'gioi-thieu', component: GioiThieuComponent },
      { path: 'account', component: AccountPageComponent }, 
      { path: 'contact', component: ContactComponent }, 
      { path: 'voucher', component: VoucherComponent }, 
      { path: 'news',component: NewsComponent,children: [{ path: ':slug', component: NewsDetailComponent },]},
      { path: 'favorite', component: FavoriteComponent },
      
      // Các route đăng nhập/đăng ký cũng nên được đặt trong Client Layout nếu muốn hiển thị header/footer
      { path: 'login', component: LoginComponent },
      { path: 'auth/callback', component: AuthCallbackComponent }, // OAuth callback route
      { path: 'verify-pin', component: VerifyPinComponent},
      { path: 'register', component: RegisterComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },

      { path: 'admin/seed', component: DataSeederComponent },
      { path: 'cart', component: CartPageComponent },
      { path: 'checkout', component: CheckoutComponent },

      //vnpay
      { path: 'payment-success', component: PaymentSuccessComponent},

      { path: '', redirectTo: '/home', pathMatch: 'full' },
    ]
  },

  // Các route này độc lập và KHÔNG sử dụng ClientLayoutComponent
  ...AdminRoutes,
  
  { path: '**', redirectTo: '/home' }
];