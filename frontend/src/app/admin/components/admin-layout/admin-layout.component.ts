import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';

// Component layout chính cho admin section
// Chứa sidebar (bên trái) và main content (header + router-outlet)
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterModule,              // Cho router-outlet
    AdminHeaderComponent,      // Header bar
    AdminSidebarComponent      // Sidebar navigation
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {}
