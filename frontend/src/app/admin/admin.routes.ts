
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CategoryAdminComponent } from './pages/category-admin/category-admin.component';
import { VoucherAdminComponent } from './pages/voucher-admin/voucher-admin.component'; 
import { ProductAdminComponent } from './pages/product-admin/product-admin.component';
import { ContactsAdminComponent } from './pages/contacts-admin/contacts-admin.component';
import { OrdersAdminComponent } from './pages/orders-admin/orders-admin.component';

// Cấu hình routing cho admin section
export const AdminRoutes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent, 
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

       { path: 'contacts', component: ContactsAdminComponent },
       { path: 'orders', component: OrdersAdminComponent },
    ]
  }
];
