import { Routes } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';
import { FooterComponent } from './components/footer/footer.component';

import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { VerifyPinComponent } from './pages/verify-pin/verify-pin.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { HomeCategoryComponent } from './components/home-category/home-category.component';
import { ProductPageComponent } from './pages/product-page/product-page.component';
import { GioiThieuComponent } from './pages/gioi-thieu/gioi-thieu.component';

import { ContactComponent } from './pages/contact/contact.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent }, 

  { path: 'category/:slug', component: HomeCategoryComponent},
  { path: 'products', component: ProductPageComponent}, 
  { path: 'products/category/:slug', component: ProductPageComponent},

  { path: 'gioi-thieu', component: GioiThieuComponent},
  { path: 'contact', component: ContactComponent },    

  { path: 'login', component: LoginComponent },
  { path: 'verify-pin', component: VerifyPinComponent},
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];
