import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
 images: string[] = [ 
    'https://res.cloudinary.com/dolqwcawp/image/upload/v1761840246/banner-home_nt1stp.png',
    'https://res.cloudinary.com/dolqwcawp/image/upload/v1761840764/311025_rlxhjl.png',  
    'https://res.cloudinary.com/dolqwcawp/image/upload/v1761841770/banner-3_gwnpel.png'
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
