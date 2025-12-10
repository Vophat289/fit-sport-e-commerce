# 📚 HƯỚNG DẪN CƠ CHẾ HOẠT ĐỘNG CỦA HỆ THỐNG ĐƠN HÀNG



---

## 🎯 TỔNG QUAN QUY TRÌNH

```
1. Khách hàng thêm sản phẩm vào giỏ → Tạo Order với status = "CART"
2. Khách hàng checkout → Chuyển status = "PENDING" 
3. Thanh toán thành công → payment_status = "SUCCESS"
4. Admin xem danh sách đơn hàng → GET /api/admin/orders
5. Admin thay đổi trạng thái → PUT /api/admin/orders/:id/status
```

---

## 📦 PHẦN 1: TẠO ĐƠN HÀNG (TỪ GIỎ HÀNG)

### Bước 1: Khách hàng thêm sản phẩm vào giỏ hàng

**Frontend:** `checkout.component.ts`
```typescript
// Khi khách hàng click "Thêm vào giỏ"
this.cartService.addToCart(productId, sizeId, colorId, quantity)
```

**Backend:** `cart.controller.js` - Hàm `addToCart()`

**Quy trình:**
1. **Kiểm tra tồn kho:**
   ```javascript
   const variant = await ProductsVariant.findOne({ 
       product_id: productId, 
       size_id: sizeId, 
       color_id: colorId 
   });
   if (variant.quantity < quantity) {
       return res.status(400).json({ message: 'Hết hàng' });
   }
   ```

2. **Tìm hoặc tạo giỏ hàng (Order với status = "CART"):**
   ```javascript
   let cart = await Oders.findOne({ 
       user_id: userId, 
       status: 'CART' 
   });
   
   if (!cart) {
       // Tạo giỏ hàng mới
       cart = await Oders.create({ 
           user_id: userId, 
           order_code: generateOrderCode(), // VD: "FS-ABC123-XYZ"
           status: 'CART',  // ⭐ Trạng thái đầu tiên
           total_price: 0, 
           delivery_fee: 0
       });
   }
   ```

3. **Thêm sản phẩm vào giỏ (OdersDetails):**
   ```javascript
   await OdersDetails.create({
       order_id: cart._id,
       variant_id: variant._id,
       price: variant.price,
       quantity: quantity
   });
   ```

4. **Giảm tồn kho:**
   ```javascript
   variant.quantity -= quantity;
   await variant.save();
   ```

**Kết quả:** 
- ✅ Tạo Order với `status = "CART"`
- ✅ Tạo OdersDetails (chi tiết sản phẩm trong giỏ)
- ✅ Giảm tồn kho

---

### Bước 2: Khách hàng checkout (Thanh toán)

**Frontend:** `checkout.component.ts` - Hàm `handleCheckout()`

**Có 2 phương thức thanh toán:**

#### 🟢 A. Thanh toán VNPay (`checkoutVNPay`)

**Quy trình:**

1. **Validate thông tin người nhận:**
   ```javascript
   if (!receiver_name || !receiver_mobile || !receiver_address) {
       return res.status(400).json({ message: 'Thiếu thông tin' });
   }
   ```

2. **Lấy giỏ hàng:**
   ```javascript
   const cart = await Oders.findOne({
       user_id: userId,
       status: 'CART'
   });
   ```

3. **Kiểm tra lại tồn kho:**
   ```javascript
   // Tính tồn kho thực tế = tồn kho hiện tại + số lượng đã có trong giỏ
   const actualStock = variant.quantity + itemInCart.quantity;
   if (actualStock < itemInCart.quantity) {
       return res.status(400).json({ message: 'Hết hàng' });
   }
   ```

4. **Tính toán giá:**
   ```javascript
   let totalPrice = 0;
   for (const item of cartDetails) {
       totalPrice += item.price * item.quantity;
   }
   const deliveryFee = 30000; // Phí cố định
   const finalAmount = totalPrice + deliveryFee - voucherDiscount;
   ```

5. **Cập nhật Order thành đơn hàng:**
   ```javascript
   cart.status = 'PENDING';           // ⭐ Chuyển từ CART → PENDING
   cart.payment_method = 'VNPAY';
   cart.payment_status = 'INIT';      // Chưa thanh toán
   cart.receiver_name = receiver_name;
   cart.receiver_mobile = receiver_mobile;
   cart.receiver_address = receiver_address;
   cart.total_price = totalPrice;
   cart.delivery_fee = deliveryFee;
   await cart.save();
   ```

6. **Tạo URL thanh toán VNPay:**
   ```javascript
   const paymentUrl = await buildPayment(finalAmount, cart.order_code);
   return res.json({ success: true, paymentUrl });
   ```

7. **Frontend redirect đến VNPay:**
   ```typescript
   window.location.href = response.paymentUrl;
   ```

**Kết quả:**
- ✅ Order chuyển từ `CART` → `PENDING`
- ✅ `payment_status = "INIT"` (chưa thanh toán)
- ✅ Khách hàng được redirect đến VNPay

---

#### 🟡 B. Thanh toán COD (Cash On Delivery)

**Quy trình tương tự VNPay, nhưng:**

```javascript
cart.status = 'PENDING';
cart.payment_method = 'COD';
cart.payment_status = 'PENDING';  // ⭐ COD luôn là PENDING (chờ nhận hàng)
```

**Khác biệt:**
- ❌ Không cần tạo URL thanh toán
- ✅ Đơn hàng được tạo ngay với `payment_status = "PENDING"`
- ✅ Admin có thể thấy đơn hàng ngay trong trang quản lý

---

### Bước 3: Xử lý callback từ VNPay

**Backend:** `vnpay.controller.js`

Khi khách hàng thanh toán xong, VNPay gọi lại server qua 2 URL:

#### A. IPN (Instant Payment Notification) - Xử lý nền
```javascript
export const ipn = async (req, res) => {
    const { vnp_TxnRef, vnp_ResponseCode } = req.query;
    
    if (vnp_ResponseCode === '00') {
        // Thanh toán thành công
        order.payment_status = 'SUCCESS';
        order.status = 'PENDING'; // Giữ nguyên PENDING, admin sẽ xác nhận sau
    } else {
        // Thanh toán thất bại → Hoàn lại tồn kho
        order.payment_status = 'FAILED';
        // Hoàn lại tồn kho cho từng sản phẩm
        await restoreInventory(orderId);
    }
    
    await order.save();
};
```

#### B. Return URL - Redirect khách hàng
```javascript
export const returnUrl = async (req, res) => {
    // Tương tự IPN, nhưng redirect khách hàng về trang kết quả
    if (paymentSuccess) {
        res.redirect('/order-success');
    } else {
        res.redirect('/order-failed');
    }
};
```

**Kết quả sau khi thanh toán VNPay:**
- ✅ `payment_status = "SUCCESS"` (nếu thành công)
- ✅ `payment_status = "FAILED"` (nếu thất bại)
- ✅ Order vẫn giữ `status = "PENDING"` (chờ admin xác nhận)

---

## 👨‍💼 PHẦN 2: ADMIN QUẢN LÝ ĐƠN HÀNG

### Bước 1: Admin mở trang quản lý đơn hàng

**Frontend:** `order-admin.component.ts`

```typescript
ngOnInit(): void {
    this.loadOrders(); // Tự động load khi component khởi tạo
}

loadOrders(): void {
    this.orderService.getOrders({
        page: this.page,
        limit: this.pageSize,
        status: this.statusFilter,
        payment_status: this.paymentStatusFilter,
        search: this.search
    }).subscribe({
        next: (res) => {
            this.orders = res.orders; // Hiển thị danh sách
        }
    });
}
```

**Backend:** `order.admin.controller.js` - Hàm `getAllOrders()`

**Quy trình:**

1. **Xây dựng query (chỉ lấy đơn hàng hợp lệ, không phải CART):**
   ```javascript
   const query = {
       status: { $ne: "CART" }  // ⭐ Loại bỏ giỏ hàng, chỉ lấy đơn hàng thật
   };
   
   // Thêm filter nếu có
   if (status) {
       query.status = status; // VD: "PENDING", "CONFIRMED", ...
   }
   
   if (payment_status) {
       query.payment_status = payment_status; // VD: "SUCCESS", "PENDING"
   }
   
   if (search) {
       query.$or = [
           { order_code: { $regex: search } },
           { receiver_name: { $regex: search } },
           { receiver_mobile: { $regex: search } }
       ];
   }
   ```

2. **Lấy danh sách đơn hàng:**
   ```javascript
   const orders = await Oders.find(query)
       .populate('user_id', 'name email phone')  // Lấy thông tin user
       .sort({ createdAt: -1 })  // Mới nhất trước
       .skip((page - 1) * limit)
       .limit(limit);
   ```

3. **Format dữ liệu để trả về:**
   ```javascript
   const formattedOrders = orders.map(order => ({
       _id: order._id,
       order_code: order.order_code,
       user: {
           name: order.user_id.name,
           email: order.user_id.email,
           phone: order.user_id.phone
       },
       receiver: {
           name: order.receiver_name,
           mobile: order.receiver_mobile,
           address: order.receiver_address
       },
       status: order.status,
       payment_status: order.payment_status,
       // ...
   }));
   ```

**Kết quả:**
- ✅ Admin thấy danh sách đơn hàng (không có CART)
- ✅ Có thể filter theo status, payment_status, search
- ✅ Có phân trang

---

### Bước 2: Admin xem chi tiết đơn hàng

**Frontend:** `order-admin.component.ts`

```typescript
viewOrderDetail(order: Order): void {
    this.orderService.getOrderDetail(order._id).subscribe({
        next: (res) => {
            this.selectedOrder = res.order;
            this.showDetailModal = true; // Mở modal
        }
    });
}
```

**Backend:** `order.admin.controller.js` - Hàm `getOrderDetail()`

**Quy trình:**

1. **Lấy thông tin đơn hàng:**
   ```javascript
   const order = await Oders.findById(orderId)
       .populate('user_id', 'name email phone')
       .populate('voucher_id', 'code value type');
   ```

2. **Lấy chi tiết sản phẩm (OdersDetails):**
   ```javascript
   const orderDetails = await OdersDetails.find({ order_id: orderId })
       .populate({
           path: 'variant_id',
           populate: [
               { path: 'product_id', select: 'name slug image' },
               { path: 'size_id', select: 'name' },
               { path: 'color_id', select: 'name hex_code' }
           ]
       });
   ```

3. **Format dữ liệu:**
   ```javascript
   const formattedItems = orderDetails.map(item => ({
       quantity: item.quantity,
       price: item.price,
       subtotal: item.price * item.quantity,
       product: {
           name: item.variant_id.product_id.name,
           image: item.variant_id.product_id.image[0]
       },
       variant: {
           size: item.variant_id.size_id.name,
           color: item.variant_id.color_id.name
       }
   }));
   ```

**Kết quả:**
- ✅ Admin thấy đầy đủ thông tin: khách hàng, người nhận, sản phẩm, giá
- ✅ Hiển thị trong modal

---

## 🔄 PHẦN 3: THAY ĐỔI TRẠNG THÁI ĐƠN HÀNG

### Bước 1: Admin chọn trạng thái mới

**Frontend:** `order-detail-modal.component.ts`

```typescript
statusOptions = [
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'PROCESSING', label: 'Đang xử lý' },
    { value: 'SHIPPING', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Giao hàng thành công' },
    { value: 'CANCELLED', label: 'Đã hủy' }
];

updateStatus(): void {
    this.orderService.updateOrderStatus(
        this.order._id, 
        this.selectedStatus
    ).subscribe({
        next: () => {
            this.order.status = this.selectedStatus;
            alert('Cập nhật thành công!');
        }
    });
}
```

**Backend:** `order.admin.controller.js` - Hàm `updateOrderStatus()`

**Quy trình:**

1. **Validate trạng thái:**
   ```javascript
   const validStatuses = [
       'PENDING', 'CONFIRMED', 'PROCESSING', 
       'SHIPPING', 'DELIVERED', 'CANCELLED'
   ];
   
   if (!validStatuses.includes(status)) {
       return res.status(400).json({ 
           message: 'Trạng thái không hợp lệ' 
       });
   }
   ```

2. **Kiểm tra đơn hàng:**
   ```javascript
   const order = await Oders.findById(orderId);
   
   // Không cho thay đổi nếu đã hủy hoặc đã giao
   if (order.status === 'CANCELLED' && status !== 'CANCELLED') {
       return res.status(400).json({ 
           message: 'Không thể thay đổi đơn hàng đã hủy' 
       });
   }
   
   if (order.status === 'DELIVERED' && status !== 'DELIVERED') {
       return res.status(400).json({ 
           message: 'Không thể thay đổi đơn hàng đã giao' 
       });
   }
   ```

3. **Xử lý đặc biệt khi hủy đơn:**
   ```javascript
   if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
       // ⭐ Hoàn lại tồn kho
       const orderDetails = await OdersDetails.find({ order_id: orderId });
       
       for (const item of orderDetails) {
           await ProductsVariant.findByIdAndUpdate(item.variant_id, {
               $inc: { quantity: item.quantity }  // Tăng lại tồn kho
           });
       }
   }
   ```

4. **Cập nhật trạng thái:**
   ```javascript
   order.status = status;
   await order.save();
   ```

**Kết quả:**
- ✅ Trạng thái đơn hàng được cập nhật
- ✅ Nếu hủy đơn → Tồn kho được hoàn lại
- ✅ Frontend tự động refresh để hiển thị trạng thái mới

---

## 📊 SƠ ĐỒ TRẠNG THÁI ĐƠN HÀNG

```
┌─────────┐
│  CART   │  ← Giỏ hàng (chưa checkout)
└────┬────┘
     │
     │ checkout()
     ▼
┌─────────┐
│ PENDING │  ← Chờ xác nhận (sau khi checkout)
└────┬────┘
     │
     │ updateStatus('CONFIRMED')
     ▼
┌─────────────┐
│ CONFIRMED   │  ← Đã xác nhận
└────┬────────┘
     │
     │ updateStatus('PROCESSING')
     ▼
┌─────────────┐
│ PROCESSING  │  ← Đang xử lý / Chuẩn bị hàng
└────┬────────┘
     │
     │ updateStatus('SHIPPING')
     ▼
┌─────────────┐
│ SHIPPING    │  ← Đang giao hàng
└────┬────────┘
     │
     │ updateStatus('DELIVERED')
     ▼
┌─────────────┐
│ DELIVERED   │  ← Giao hàng thành công (KẾT THÚC)
└─────────────┘

     │
     │ (Có thể hủy từ bất kỳ trạng thái nào)
     ▼
┌─────────────┐
│ CANCELLED   │  ← Đã hủy (KẾT THÚC)
└─────────────┘
```

---

## 🔐 TRẠNG THÁI THANH TOÁN (payment_status)

```
INIT     → Chưa thanh toán (sau khi checkout VNPay)
PENDING  → Chờ thanh toán (COD hoặc đang chờ VNPay)
SUCCESS  → Thanh toán thành công
FAILED   → Thanh toán thất bại
```

**Lưu ý:**
- VNPay: `INIT` → `SUCCESS` hoặc `FAILED` (sau callback)
- COD: Luôn là `PENDING` (chờ nhận hàng mới thanh toán)

---

## 🎓 TÓM TẮT CHO SINH VIÊN

### 1. **Luồng tạo đơn hàng:**
```
Thêm vào giỏ → Tạo Order (CART) 
→ Checkout → Chuyển thành PENDING 
→ Thanh toán → payment_status = SUCCESS
```

### 2. **Luồng admin xem đơn:**
```
GET /api/admin/orders 
→ Filter (status, payment_status, search) 
→ Hiển thị danh sách
```

### 3. **Luồng thay đổi trạng thái:**
```
Admin chọn trạng thái mới 
→ PUT /api/admin/orders/:id/status 
→ Validate → Cập nhật database 
→ Nếu hủy → Hoàn lại tồn kho
```

### 4. **Điểm quan trọng:**
- ⭐ Order với `status = "CART"` không hiển thị trong admin (bị filter)
- ⭐ Khi hủy đơn → Tự động hoàn lại tồn kho
- ⭐ Không thể thay đổi đơn đã `DELIVERED` hoặc `CANCELLED`
- ⭐ Tồn kho bị giảm khi thêm vào giỏ, không phải khi checkout

---

## 📝 CÁC API ENDPOINT

### User (Khách hàng):
- `POST /api/cart/add` - Thêm vào giỏ
- `POST /api/cart/checkout-vnpay` - Checkout VNPay
- `POST /api/cart/checkout-cod` - Checkout COD

### Admin:
- `GET /api/admin/orders` - Lấy danh sách đơn hàng
- `GET /api/admin/orders/:id` - Lấy chi tiết đơn hàng
- `PUT /api/admin/orders/:id/status` - Cập nhật trạng thái

---

## ❓ CÂU HỎI THƯỜNG GẶP

**Q: Tại sao tồn kho giảm khi thêm vào giỏ, không phải khi checkout?**
A: Để tránh trường hợp nhiều người cùng checkout một sản phẩm cuối cùng. Khi thêm vào giỏ, sản phẩm đã được "reserve" (đặt chỗ).

**Q: Đơn hàng CART có hiển thị trong admin không?**
A: Không. Admin chỉ thấy đơn hàng có `status != "CART"`.

**Q: Khi nào tồn kho được hoàn lại?**
A: Khi admin hủy đơn hàng (`status = "CANCELLED"`) hoặc thanh toán VNPay thất bại.

**Q: COD và VNPay khác nhau như thế nào?**
A: 
- VNPay: `payment_status = "INIT"` → `"SUCCESS"` (sau callback)
- COD: `payment_status = "PENDING"` (luôn luôn, vì chưa nhận hàng)

---

**Chúc bạn học tốt! 🚀**

