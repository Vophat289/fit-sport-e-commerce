import { Component, OnInit } from '@angular/core';
import { VNPaymentService } from '@app/services/vn_payment.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService, CartItem } from '@app/services/cart.service';
import { AccountService, Address } from '@app/services/account.service';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit{

  paymentMethod: 'VNPAY' | 'COD' = 'VNPAY'; 

  receiver_name = '';
  receiver_mobile = '';
  receiver_address = '';
  voucher_code = '';
  
  selectedItems: CartItem[] = [];
  subtotal = 0;
  deliveryFee = 30000;
  voucherDiscount = 0;
  totalAmount = 0;
  loading = false;
  freeShipThreshold = 100000;

  // Quản lý địa chỉ
  addresses: Address[] = [];
  selectedAddressId: string | null = null;
  useNewAddress: boolean = false;

  constructor(
    private vnpaymentService: VNPaymentService,
    private cartService: CartService,
    private accountService: AccountService,
    private http: HttpClient,
    private router: Router
  ){}

  ngOnInit(): void {
    this.loadSelectedItems();
    this.loadAddresses();
  }

  loadAddresses() {
    this.accountService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        
        // Nếu có địa chỉ mặc định, tự động chọn
        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          this.selectAddress(defaultAddress);
        } else if (addresses.length > 0) {
          // Nếu không có mặc định, chọn địa chỉ đầu tiên
          this.selectAddress(addresses[0]);
        } else {
          // Không có địa chỉ nào, cho phép nhập mới
          this.useNewAddress = true;
        }
      },
      error: (err) => {
        console.error('Lỗi khi load địa chỉ:', err);
        // Nếu lỗi, cho phép nhập địa chỉ mới
        this.useNewAddress = true;
      }
    });
  }

  selectAddress(address: Address) {
    this.selectedAddressId = address._id;
    this.useNewAddress = false;
    
    // Tự động điền form
    this.receiver_name = address.receiverName;
    this.receiver_mobile = address.phone;
    
    // Ghép địa chỉ: street, ward, district, province
    const addressParts = [
      address.street,
      address.ward,
      address.district,
      address.province
    ].filter(part => part && part.trim());
    
    this.receiver_address = addressParts.join(', ');
  }

  selectAddressFromId() {
    if (!this.selectedAddressId) {
      return;
    }
    
    const address = this.addresses.find(addr => addr._id === this.selectedAddressId);
    if (address) {
      this.selectAddress(address);
    }
  }

  useNewAddressToggle() {
    if (this.useNewAddress) {
      this.selectedAddressId = null;
      // Xóa form khi chọn nhập mới
      this.receiver_name = '';
      this.receiver_mobile = '';
      this.receiver_address = '';
    }
  }

  loadSelectedItems() {
    // Lấy selected items từ localStorage
    const selectedStr = localStorage.getItem('selectedCartItems');
    if (selectedStr) {
      this.selectedItems = JSON.parse(selectedStr);
      this.calculateTotals();
    } else {
      alert('Không có sản phẩm được chọn. Vui lòng quay lại giỏ hàng.');
      this.router.navigate(['/cart']);
    }
  }

  calculateTotals() {
    this.subtotal = this.selectedItems.reduce((sum, item) => {
      return sum + (item.price * (item.quantityToAdd || 1));
    }, 0);

    // Tính phí vận chuyển
    if (this.subtotal === 0) {
      this.deliveryFee = 0;
    } else if (this.subtotal >= this.freeShipThreshold) {
      this.deliveryFee = 0;
    } else {
      this.deliveryFee = 30000;
    }

    this.totalAmount = this.subtotal + this.deliveryFee - this.voucherDiscount;
  }

  handleCheckout() {
    if (!this.receiver_name || !this.receiver_mobile || !this.receiver_address) {
      alert('Vui lòng điền đầy đủ thông tin người nhận');
      return;
    }

    if (!this.selectedItems || this.selectedItems.length === 0) {
      alert('Không có sản phẩm được chọn');
      this.router.navigate(['/cart']);
      return;
    }

    this.loading = true;

    // Bước 1: Sync cart từ localStorage lên backend database
    this.cartService.syncCartToBackend(this.selectedItems).subscribe({
      next: (syncSuccess) => {
        if (!syncSuccess) {
          this.loading = false;
          alert('Lỗi khi đồng bộ giỏ hàng lên server');
          return;
        }

        //kiểm tra ptttoan
        if(this.paymentMethod === 'COD'){

          this.handleCODCheckout();
        }else{

          this.handleVNPayCheckout();
        }

        // const checkoutData = {
        //   receiver_name: this.receiver_name,
        //   receiver_mobile: this.receiver_mobile,
        //   receiver_address: this.receiver_address,
        //   voucher_code: this.voucher_code || null
        // };

        // this.http.post('/api/cart/checkout', checkoutData).subscribe({
        //   next: (response: any) => {
        //     this.loading = false;
        //     if (response.success && response.paymentUrl) {
        //       // Xóa selected items và localStorage cart sau khi checkout thành công
        //       localStorage.removeItem('selectedCartItems');
        //       // Redirect đến VNPay
        //       window.location.href = response.paymentUrl;
        //     } else {
        //       alert('Lỗi khi tạo thanh toán');
        //     }
        //   },
        //   error: (err) => {
        //     this.loading = false;
        //     console.error('❌ Lỗi checkout:', err);
        //     console.error('❌ Error details:', {
        //       status: err.status,
        //       message: err.error?.message,
        //       error: err.error?.error,
        //       details: err.error?.details
        //     });
        //     const errorMsg = err.error?.message || err.error?.error || 'Lỗi khi xử lý thanh toán';
        //     alert(errorMsg);
        //   }
        // });
      },
      error: (syncError) => {
        this.loading = false;
        console.error('Lỗi sync cart:', syncError);
        alert(syncError.error?.message || 'Lỗi khi đồng bộ giỏ hàng. Vui lòng thử lại.');
      }
    });
  }

  handleCODCheckout(){
    const checkoutData ={
      receiver_name: this.receiver_name,
      receiver_mobile: this.receiver_mobile,
      receiver_address: this.receiver_address,
      voucher_code: this.voucher_code || null,
      payment_method: 'COD',
    };

    //gọi api checkout cod
    this.http.post('/api/cart/checkout', checkoutData).subscribe({
      next: (response: any) => {
        this.loading = false;
        if(response.success){
          // Xóa selectedCartItems
          localStorage.removeItem('selectedCartItems');
          
          // Xóa giỏ hàng chính (my_cart)
          // Sau khi thanh toán thành công, cần xóa items đã thanh toán khỏi giỏ hàng
          this.removePurchasedItemsFromCart();
          
          //redirect đến trang thành công
          this.router.navigate(['/payment-success'], {
            queryParams:{
              success: true,
              method: 'COD',
              orderId: response.orderId,
              orderCode: response.orderCode
            }
          });
        }else{
          alert(response.message || 'Lỗi khi tạo đơn hàng');
        }
      },
    error: (err) => {
      this.loading = false; 
      console.error('Lỗi checkout COD: ', err);
      const errorMsg = err.error?.message || 'Lỗi khi tạo đơn hàng COD';
      alert(errorMsg);
     
    }
  });
  }

  handleVNPayCheckout(){
    const checkoutData = {
      receiver_name: this.receiver_name,
      receiver_mobile: this.receiver_mobile,
      receiver_address: this.receiver_address,
      voucher_code: this.voucher_code || null,
      payment_method: 'VNPAY',
    };

    this.http.post<any>('/api/cart/checkout', checkoutData).subscribe({
      next: (response) => {
        this.loading = false;
        if(response.success && response.paymentUrl){
          // KHÔNG xóa cart ở đây - chỉ xóa khi thanh toán thành công
          // Lưu orderId để sau khi thanh toán thành công mới xóa
          sessionStorage.setItem('pendingOrderId', response.orderId);
          sessionStorage.setItem('pendingOrderCode', response.orderCode);
          
          // Redirect đến VNPay
          window.location.href = response.paymentUrl;
        }else{
          alert('Lỗi khi tạo đơn hàng');
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Lỗi checkout VN Pay:', err);
        const errorMsg = err.error?.message || 'Lỗi khi tạo đơn hàng VN Pay';
        alert(errorMsg);
      }
    });
  }

  // Xóa các items đã thanh toán khỏi giỏ hàng localStorage
  private removePurchasedItemsFromCart(): void {
    try {
      // Lấy giỏ hàng chính từ localStorage trực tiếp
      const cartStr = localStorage.getItem('my_cart');
      if (!cartStr) {
        return; // Không có giỏ hàng, không cần xóa
      }

      const cart = JSON.parse(cartStr);
      if (!cart || !cart.items || cart.items.length === 0) {
        return; // Giỏ hàng đã trống, không cần xóa gì
      }

      // Lấy danh sách variant_id của items đã thanh toán
      const purchasedVariantIds = new Set(
        this.selectedItems.map(item => item.variant_id)
      );
      
      // Lọc bỏ các items đã mua khỏi giỏ hàng
      const remainingItems = cart.items.filter((item: CartItem) => {
        return !purchasedVariantIds.has(item.variant_id);
      });

      // Cập nhật lại giỏ hàng
      if (remainingItems.length === 0) {
        // Nếu không còn items nào, xóa hết giỏ hàng
        this.cartService.clearCart();
      } else {
        // Nếu còn items, cập nhật lại giỏ hàng với items còn lại
        const updatedCart = {
          ...cart,
          items: remainingItems
        };
        localStorage.setItem('my_cart', JSON.stringify(updatedCart));
        // Refresh cart count sau khi update localStorage
        this.cartService.refreshCartCount();
      }
      
      console.log('Đã xóa items đã thanh toán khỏi giỏ hàng. Còn lại:', remainingItems.length, 'items');
    } catch (error) {
      console.error('Lỗi khi xóa items đã thanh toán khỏi giỏ hàng:', error);
      // Nếu có lỗi, vẫn xóa hết giỏ hàng để đảm bảo không bị duplicate
      this.cartService.clearCart();
    }
  }
}
