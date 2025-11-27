
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CategoryAdminComponent } from './pages/category-admin/category-admin.component';

// Cấu hình routing cho admin section
export const AdminRoutes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent, 
    children: [
      
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      { path: 'dashboard', component: DashboardComponent },
      { path: 'category-admin', component: CategoryAdminComponent }

    ]
  }
];
