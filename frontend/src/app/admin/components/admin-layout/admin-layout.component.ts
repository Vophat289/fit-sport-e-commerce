import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminThemeService } from '../../services/theme.service';

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
export class AdminLayoutComponent implements OnInit, OnDestroy {
  constructor(private adminThemeService: AdminThemeService) {}

  ngOnInit(): void {
    this.adminThemeService.attach();
  }

  ngOnDestroy(): void {
    this.adminThemeService.detach();
  }
}
