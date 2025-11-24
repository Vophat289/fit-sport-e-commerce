import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '@app/services/product.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit{
  product: Product | null = null;

  loading: boolean = true;

  error: string | null = null;

  selectedImageIndex: number = 0;

  selectedColor: string | null = null;
  selectedSize: string | null = null;

  quantity: number = 1;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private productService: ProductService
  ){}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if(slug){
      this.loadProduct(slug);
    }else{
      //k có thì quay về trang sp
      this.router.navigate(['/products']);
    }
  }
  
  loadProduct(slug: string): void{
    this.loading = true;
    this.error = null;

    this.productService.getBySlugProduct(slug).subscribe({
      next: (data) =>{
        this.product = data;
        this.loading = false;

        //mặc định chọn màu và size
        if(data.colors && data.colors.length > 0){
          this.selectedColor = data.colors[0]
        }
        if(data.sizes && data.sizes.length > 0){
          this.selectedSize = data.sizes[0]
        }

        this.incrementViewCount(slug);
      },
      error: (err) => {
        console.error('Lỗi tải sản phẩm', err);
        this.error = 'Không tìm thấy sản phẩm';
        this.loading = false;


        //quay về trang sp
        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 2000);
      }
    });
  }

  //image
  selectImage(index: number): void{
    this.selectedImageIndex = index;
  }
  
  //color
  selectColor(color: string): void {
    this.selectedColor = color;
  }

  //size
  selectSize(size: string): void{
    this.selectedSize = size;
  }

  increaseQuantity(): void{
    this.quantity++;
  }

  decreaseQuantity(): void{
    if(this.quantity > 1){
      this.quantity--;
    }
  }
   
  //hàm lượt xem 
  incrementViewCount(slug: string): void{
    this.productService.incrementView(slug).subscribe({
      next: (data) => {
        if(this.product){
          this.product.viewCount = data.viewCount;
        }
      },
      error: (err) => {
        console.error('Lỗi tăng lượt xem', err);
      }
    }) 
  }
}
