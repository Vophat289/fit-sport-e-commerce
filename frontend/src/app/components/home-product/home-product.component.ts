import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '@app/services/product.service';
import { Router } from '@angular/router';
import { ProductModalComponent, VariantSelection } from '@app/components/product-modal/product-modal.component'; 
import { CartService, CartItem } from '@app/services/cart.service';

@Component({
  selector: 'app-home-product',
  imports: [CommonModule, ProductModalComponent],
  templateUrl: './home-product.component.html',
  styleUrl: './home-product.component.css'
})
export class HomeProductComponent implements OnInit{
  products: Product[] = [];
  loading = true; //loading chờ sp
  isModalOpen: boolean = false;
  selectedProduct: Product | null = null;
  //khởi tạo service
  constructor(
    private productService: ProductService,
    private router: Router,
    private cartService: CartService
  ){}

  ngOnInit(): void {
    this.loadProducts(); // hàm load sản phẩm
  }

  //load sp từ api
  loadProducts(): void {
    //gọi service để lấy danh sách sp
    this.productService.getAll().subscribe({
      //next xử lí khi thành cong
      next: (data) => {
        this.products = [...data].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
        this.loading = false;
        console.log('Sản phẩm đã tải: ', data);
      },
      error:(err) => {
        console.error('Lỗi tải sản phẩm: ', err);
        this.loading = false;

      }
    });
  }

  viewProductDetail(product: Product): void{
    this.router.navigate(['/products', product.slug]);
  }

  //UI Tĩnh test 
  addToCart(product: any) {
  console.log('🛒 Đã thêm vào giỏ:', product.name);
  
  } 
openVariantModal(product: Product): void {
    this.selectedProduct = product;
    this.isModalOpen = true;
    // Nếu sử dụng ChangeDetectorRef, hãy gọi: this.cdr.detectChanges();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedProduct = null;
  }

  handleAddToCart(payload: VariantSelection): void {
    const imageString = Array.isArray(this.selectedProduct!.image)
      ? this.selectedProduct!.image[0]
      : this.selectedProduct!.image || 'assets/images/placeholder-shirt.png';

    const cartPayload = {
      productId: this.selectedProduct!._id as string,
      name: this.selectedProduct!.name,
      price: payload.price,
      image: imageString,
      sizeId: payload.sizeId,
      sizeName: payload.sizeName,
      colorId: payload.colorId,
      colorName: payload.colorName,
      quantityToAdd: payload.quantity,
    };

    // Logic kiểm tra tồn kho và gọi service
    this.cartService.getCartDetails().subscribe((cartData) => {
      const existingItem = cartData.items.find(
        (i) =>
          i.variant_id === cartPayload.productId &&
          i.sizeId === cartPayload.sizeId &&
          i.colorId === cartPayload.colorId
      );

      const maxStock = payload.stock || 0;
      const totalDesiredQuantity =
        (existingItem?.quantityToAdd || 0) + cartPayload.quantityToAdd;

      if (totalDesiredQuantity > maxStock) {
        const canAdd = maxStock - (existingItem?.quantityToAdd || 0);
        if (canAdd <= 0) {
          alert(`Đã hết tồn kho cho sản phẩm này.`);
          return;
        }

        const confirmAdd = confirm(
          `Số lượng yêu cầu vượt quá tồn kho. Bạn có muốn thêm ${canAdd} sản phẩm còn lại không?`
        );
        if (!confirmAdd) return;

        cartPayload.quantityToAdd = canAdd;
      }

      this.cartService.addToCart(cartPayload).subscribe({
        next: () => {
          alert(
            `Đã thêm ${cartPayload.quantityToAdd} ${
              this.selectedProduct!.name
            } vào giỏ hàng!`
          );
          this.closeModal();
        },
        // 3b. Khai báo kiểu tường minh cho 'err'
        error: (err: any) => { 
          console.error('Thêm vào giỏ hàng thất bại:', err);
          alert('Thêm vào giỏ hàng thất bại.');
        },
      });
    });
  }
}