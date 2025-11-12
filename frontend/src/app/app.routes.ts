import { Routes } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';
import { FooterComponent } from './components/footer/footer.component';


import { HomeCategoryComponent } from './components/home-category/home-category.component';
import { ProductPageComponent } from './pages/product-page/product-page.component'

export const routes: Routes = [
    { path: 'home', component:HomeComponent  },
    { path: '', redirectTo: 'home', pathMatch: 'full'},
    { path: 'category/:slug', component: HomeCategoryComponent},
    { path: 'products', component: ProductPageComponent}, 
    { path: 'products/category/:slug', component: ProductPageComponent},
    { path: '**', redirectTo: 'home'}
];
