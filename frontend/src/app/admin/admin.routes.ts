
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminGuard } from '../admin/guards/admin.guards';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CategoryAdminComponent } from './pages/category-admin/category-admin.component';
import { VoucherAdminComponent } from './pages/voucher-admin/voucher-admin.component'; 
import { ProductAdminComponent } from './pages/product-admin/product-admin.component';
import { UserAdminComponent } from './pages/manager-user/manager-user.component';


// Cấu hình routing cho admin section
export const AdminRoutes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent, 
    canActivate :[AdminGuard],
    children: [
      
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // Dashboard route
      { path: 'dashboard', component: DashboardComponent },
      { path: 'category-admin', component: CategoryAdminComponent },
      // Thêm route voucher
      { path: 'vouchers', component: VoucherAdminComponent },
      
      // Các route khác sẽ được thêm ở đây:
      // { path: 'categories', component: CategoriesComponent },
      { path: 'products', component: ProductAdminComponent },
      { path: 'manager-user', component: UserAdminComponent },

    ]
  }
];
