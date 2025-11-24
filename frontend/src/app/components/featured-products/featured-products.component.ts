import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '@app/services/product.service';

@Component({
  selector: 'app-featured-products',
  imports: [CommonModule],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.css'
})
export class FeaturedProductsComponent implements OnInit{

  featuredProducts: Product[] = [];

  loading: boolean = true;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    
  }


  
}
