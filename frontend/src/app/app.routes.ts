import { Routes } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';
import { FooterComponent } from './components/footer/footer.component';

import { HomeCategoryComponent } from './components/home-category/home-category.component';

export const routes: Routes = [
    { path: 'home', component:HomeComponent  },
    { path: '', redirectTo: '/home', pathMatch: 'full'},
    { path: 'category/:slug', component: HomeCategoryComponent}, //category client
    { path: '**', redirectTo: '/home'}
];
