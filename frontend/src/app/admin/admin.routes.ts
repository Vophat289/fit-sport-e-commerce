import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

// Cấu hình routing cho admin section
export const AdminRoutes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent, // Layout chứa sidebar + header
    children: [
      // Redirect /admin → /admin/dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // Dashboard route
      { path: 'dashboard', component: DashboardComponent }
      // Các route khác sẽ được thêm ở đây:
      // { path: 'categories', component: CategoriesComponent },
      // { path: 'products', component: ProductsComponent },
    ]
  }
];
