import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeCategoryComponent } from '../home-category/home-category.component'
import { HomeProductComponent } from '../home-product/home-product.component';
import { HomeBestSellingProductComponent } from '../home-best-selling-product/home-best-selling-product.component';
@Component({
  selector: 'app-home',
  imports: [CommonModule, HomeCategoryComponent, HomeProductComponent, HomeBestSellingProductComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
 images: string[] = [ 
    'https://res.cloudinary.com/dolqwcawp/image/upload/v1766527408/home_slider_image_2_febhli.jpg',
    'https://res.cloudinary.com/dolqwcawp/image/upload/v1766520354/banner-vnvodich_kfolfk.jpg',  
    'https://res.cloudinary.com/dolqwcawp/image/upload/v1766535731/banner-3333_glossg.jpg'
  ];

  current = 0;

  ngOnInit() {
    setInterval(() => {
      this.next();
    }, 4000); // 4 giây đổi ảnh
  }

  next() {
    this.current = (this.current + 1) % this.images.length;
  }

  prev() {
    this.current = (this.current - 1 + this.images.length) % this.images.length;
  }
}
