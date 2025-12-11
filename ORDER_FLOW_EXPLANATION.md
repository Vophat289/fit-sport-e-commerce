# 📚 CƠ CHẾ HOẠT ĐỘNG CỦA HỆ THỐNG ĐƠN HÀNG

Tài liệu này giải thích chi tiết cách hệ thống xử lý đơn hàng từ lúc khách hàng tạo đơn đến khi admin quản lý và thay đổi trạng thái.

---

## 🎯 TỔNG QUAN

Hệ thống đơn hàng hoạt động theo 3 giai đoạn chính:
1. **Tạo đơn hàng** (Customer checkout)
2. **Hiển thị đơn hàng** (Admin xem danh sách)
3. **Thay đổi trạng thái** (Admin cập nhật)

---

## 📦 PHẦN 1: QUY TRÌNH TẠO ĐƠN HÀNG

### Bước 1: Khách hàng thêm sản phẩm vào giỏ hàng

**Frontend:** `checkout.component.ts`
- Khách hàng chọn sản phẩm và thêm vào giỏ hàng
- Dữ liệu được lưu tạm trong `localStorage`

**Backend:** `cart.controller.js` - hàm `addToCart()`
- Khi thêm vào giỏ, hệ thống tạo một bản ghi trong bảng `Oders` với `status = 'CART'`
- **Quan trọng:** Tồn kho (stock) bị **giảm ngay lập tức** để "reserve" (giữ chỗ) sản phẩm
  ```javascript
  // Ví dụ: Sản phẩm có 10 cái, khách thêm 2 vào giỏ
  // → Tồn kho còn lại: 10 - 2 = 8 (đã reserve 2 cái)
  ```

---

### Bước 2: Khách hàng điền thông tin và chọn phương thức thanh toán

**Frontend:** `checkout.component.html`
- Khách điền: Tên người nhận, Số điện thoại, Địa chỉ
- Chọn phương thức thanh toán: **VNPay** hoặc **COD** (Thanh toán khi nhận hàng)

---

### Bước 3: Khách hàng nhấn "Đặt hàng"

**Frontend:** `checkout.component.ts` - hàm `handleCheckout()`

```typescript
// Bước 3.1: Đồng bộ giỏ hàng từ localStorage lên server
this.cartService.syncCartToBackend(this.selectedItems)

// Bước 3.2: Gọi API checkout tùy theo phương thức thanh toán
if (paymentMethod === 'COD') {
  this.handleCODCheckout();  // → Gọi API: POST /api/cart/checkout-cod
} else {
  this.handleVNPayCheckout(); // → Gọi API: POST /api/cart/checkout-vnpay
}
```

---

### Bước 4: Backend xử lý checkout

#### 4A. Nếu thanh toán bằng VNPay

**Backend:** `cart.controller.js` - hàm `checkoutVNPay()`

**Các bước xử lý:**

1. **Validate thông tin người nhận**
   ```javascript
   if (!receiver_name || !receiver_mobile || !receiver_address) {
     return error: "Vui lòng điền đầy đủ thông tin"
   }
   ```

2. **Tìm giỏ hàng (CART) của user**
   ```javascript
   const cart = await Oders.findOne({
     user_id: userId,
     status: 'CART'  // Chỉ lấy giỏ hàng chưa checkout
   });
   ```

3. **Kiểm tra tồn kho**
   - Lấy tất cả sản phẩm trong giỏ (`OdersDetails`)
   - Kiểm tra từng sản phẩm xem còn đủ hàng không
   - **Lưu ý:** Tồn kho đã bị giảm khi thêm vào giỏ, nên cần tính lại:
     ```javascript
     actualStock = currentStock + reservedQuantity
     // Ví dụ: Tồn kho hiện tại = 8, đã reserve = 2
     // → Tồn kho thực tế = 8 + 2 = 10
     ```

4. **Tính toán giá tiền**
   - Tổng giá sản phẩm
   - Phí giao hàng (30,000đ nếu đơn < 1,000,000đ)
   - Áp dụng voucher (nếu có)
   - **Tổng cuối cùng** = Tổng giá + Phí giao hàng - Giảm giá voucher

5. **Cập nhật giỏ hàng thành đơn hàng**
   ```javascript
   cart.status = 'PENDING';              // Chuyển từ CART → PENDING
   cart.payment_method = 'VNPAY';
   cart.payment_status = 'INIT';         // Chưa thanh toán
   cart.receiver_name = receiver_name;
   cart.receiver_mobile = receiver_mobile;
   cart.receiver_address = receiver_address;
   cart.total_price = totalPrice;
   cart.delivery_fee = deliveryFee;
   await cart.save();  // Lưu vào database
   ```

6. **Tạo VNPay payment URL**
   - Tạo `vnpay_transaction_id` (dùng `order_code`)
   - Gọi VNPay API để tạo link thanh toán
   - Cập nhật `payment_status = 'PENDING'` (đang chờ thanh toán)

7. **Trả về kết quả cho Frontend**
   ```json
   {
     "success": true,
     "orderId": "abc123",
     "orderCode": "ORD20241201001",
     "paymentUrl": "https://sandbox.vnpayment.vn/...",
     "amount": 500000
   }
   ```

**Frontend nhận được `paymentUrl` → Redirect khách hàng sang trang VNPay để thanh toán**

---

#### 4B. Nếu thanh toán bằng COD

**Backend:** `cart.controller.js` - hàm `checkoutCOD()`

**Các bước tương tự VNPay, nhưng:**

1. Không cần tạo payment URL
2. `payment_status = 'PENDING'` (sẽ chuyển thành `SUCCESS` khi giao hàng thành công)
3. Trả về kết quả ngay:
   ```json
   {
     "success": true,
     "orderId": "abc123",
     "orderCode": "ORD20241201001",
     "message": "Đặt hàng thành công"
   }
   ```

---

### Bước 5: VNPay callback (chỉ với VNPay)

Sau khi khách thanh toán xong trên VNPay, VNPay sẽ gọi lại server qua:
- **IPN URL** (Instant Payment Notification): `/api/vnpay/ipn`
- **Return URL**: `/api/vnpay/return`

**Backend:** `vnpay.controller.js`

Khi thanh toán thành công:
```javascript
// Cập nhật payment_status = 'SUCCESS'
order.payment_status = 'SUCCESS';
await order.save();
```

---

## 📋 PHẦN 2: QUY TRÌNH LẤY DANH SÁCH ĐƠN HÀNG (ADMIN)

### Bước 1: Admin mở trang quản lý đơn hàng

**Frontend:** `order-admin.component.ts` - hàm `ngOnInit()`

```typescript
ngOnInit() {
  this.loadOrders();  // Gọi API lấy danh sách đơn hàng
}
```

---

### Bước 2: Frontend gọi API

**Service:** `order-admin.service.ts` - hàm `getOrders()`

```typescript
getOrders(params: {
  page?: number;           // Trang hiện tại (mặc định: 1)
  limit?: number;          // Số đơn/trang (mặc định: 10)
  status?: string;         // Lọc theo trạng thái (PENDING, CONFIRMED, ...)
  payment_status?: string; // Lọc theo trạng thái thanh toán
  payment_method?: string; // Lọc theo phương thức (COD, VNPAY)
  search?: string;         // Tìm kiếm theo mã đơn, tên, SĐT
}): Observable<OrderListResponse>
```

**API Request:**
```
GET /api/admin/orders?page=1&limit=10&status=PENDING&search=ORD2024
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### Bước 3: Backend xử lý request

**Route:** `order.admin.routes.js`
```javascript
router.get("/", getAllOrders);  // Gọi hàm getAllOrders
```

**Middleware:**
- `authMiddleware`: Kiểm tra đã đăng nhập chưa
- `isAdmin`: Kiểm tra có phải admin không

**Controller:** `order.admin.controller.js` - hàm `getAllOrders()`

**Các bước xử lý:**

1. **Xây dựng query (tìm kiếm)**
   ```javascript
   const query = {
     status: { $ne: "CART" }  // Chỉ lấy đơn hàng thật, không lấy giỏ hàng
   };
   
   // Thêm filter nếu có
   if (status) query.status = status;
   if (payment_status) query.payment_status = payment_status;
   if (payment_method) query.payment_method = payment_method;
   
   // Tìm kiếm theo mã đơn, tên, SĐT
   if (search) {
     query.$or = [
       { order_code: { $regex: search, $options: "i" } },
       { receiver_name: { $regex: search, $options: "i" } },
       { receiver_mobile: { $regex: search, $options: "i" } }
     ];
   }
   ```

2. **Đếm tổng số đơn hàng** (để phân trang)
   ```javascript
   const total = await Oders.countDocuments(query);
   ```

3. **Lấy danh sách đơn hàng từ database**
   ```javascript
   const orders = await Oders.find(query)
     .populate('user_id', 'name email phone')  // Lấy thông tin user
     .sort({ createdAt: -1 })                   // Sắp xếp mới nhất trước
     .skip((page - 1) * limit)                   // Bỏ qua các đơn ở trang trước
     .limit(parseInt(limit))                     // Chỉ lấy số lượng cần thiết
     .lean();                                     // Trả về plain object (nhanh hơn)
   ```

4. **Format dữ liệu để trả về Frontend**
   ```javascript
   const formattedOrders = orders.map(order => {
     return {
       _id: order._id,
       order_code: order.order_code,
       user: {
         name: order.user_id?.name || "N/A",
         email: order.user_id?.email || "N/A",
         phone: order.user_id?.phone || "N/A"
       },
       receiver: {
         name: order.receiver_name,
         mobile: order.receiver_mobile,
         address: order.receiver_address
       },
       total_price: order.total_price,
       delivery_fee: order.delivery_fee,
       final_amount: order.total_price + order.delivery_fee,
       status: order.status,
       payment_method: order.payment_method,
       payment_status: order.payment_status,
       createdAt: order.createdAt,
       updatedAt: order.updatedAt
     };
   });
   ```

5. **Trả về kết quả**
   ```json
   {
     "success": true,
     "total": 150,           // Tổng số đơn hàng
     "page": 1,              // Trang hiện tại
     "limit": 10,            // Số đơn/trang
     "totalPages": 15,       // Tổng số trang
     "orders": [
       {
         "_id": "abc123",
         "order_code": "ORD20241201001",
         "user": { "name": "Nguyễn Văn A", "email": "a@email.com", "phone": "0123456789" },
         "receiver": { "name": "Nguyễn Văn A", "mobile": "0123456789", "address": "123 Đường ABC" },
         "total_price": 500000,
         "delivery_fee": 30000,
         "final_amount": 530000,
         "status": "PENDING",
         "payment_method": "VNPAY",
         "payment_status": "SUCCESS",
         "createdAt": "2024-12-01T10:00:00.000Z",
         "updatedAt": "2024-12-01T10:00:00.000Z"
       },
       // ... các đơn hàng khác
     ]
   }
   ```

---

### Bước 4: Frontend hiển thị danh sách

**Component:** `order-admin.component.ts`

```typescript
loadOrders() {
  this.loading = true;
  this.orderService.getOrders({
    page: this.currentPage,
    limit: this.itemsPerPage,
    status: this.selectedStatus,
    payment_status: this.selectedPaymentStatus,
    payment_method: this.selectedPaymentMethod,
    search: this.searchTerm
  }).subscribe({
    next: (response) => {
      this.orders = response.orders;        // Danh sách đơn hàng
      this.totalOrders = response.total;    // Tổng số đơn
      this.totalPages = response.totalPages; // Tổng số trang
      this.loading = false;
    },
    error: (error) => {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      this.loading = false;
    }
  });
}
```

**Template:** `order-admin.component.html`
- Hiển thị danh sách đơn hàng trong bảng
- Mỗi đơn hàng có nút "Xem chi tiết" → Mở modal

---

## 🔄 PHẦN 3: QUY TRÌNH THAY ĐỔI TRẠNG THÁI ĐƠN HÀNG

### Bước 1: Admin click "Xem chi tiết" đơn hàng

**Frontend:** `order-admin.component.html`
```html
<button (click)="openOrderDetail(order._id)">Xem chi tiết</button>
```

**Component:** `order-admin.component.ts`
```typescript
openOrderDetail(orderId: string) {
  // Gọi API lấy chi tiết đơn hàng
  this.orderService.getOrderDetail(orderId).subscribe({
    next: (response) => {
      this.selectedOrder = response.order;
      this.showDetailModal = true;  // Hiển thị modal
    }
  });
}
```

---

### Bước 2: Backend trả về chi tiết đơn hàng

**Controller:** `order.admin.controller.js` - hàm `getOrderDetail()`

**Các bước:**

1. **Lấy thông tin đơn hàng**
   ```javascript
   const order = await Oders.findById(orderId)
     .populate('user_id', 'name email phone')
     .populate('voucher_id', 'code value type');
   ```

2. **Lấy chi tiết sản phẩm trong đơn**
   ```javascript
   const orderDetails = await OdersDetails.find({ order_id: orderId })
     .populate({
       path: 'variant_id',
       populate: [
         { path: 'product_id', select: 'name slug image' },
         { path: 'size_id', select: 'name' },
         { path: 'color_id', select: 'name hex' }
       ]
     });
   ```

3. **Format dữ liệu và trả về**
   ```json
   {
     "success": true,
     "order": {
       "_id": "abc123",
       "order_code": "ORD20241201001",
       "user": { "name": "Nguyễn Văn A", ... },
       "receiver": { "name": "Nguyễn Văn A", ... },
       "items": [
         {
           "product": { "name": "Áo thun", "image": "..." },
           "variant": { "size": "M", "color": "Đỏ" },
           "quantity": 2,
           "price": 250000,
           "subtotal": 500000
         }
       ],
       "pricing": {
         "total_items": 2,
         "total_price": 500000,
         "delivery_fee": 30000,
         "voucher_discount": 0,
         "final_amount": 530000
       },
       "status": "PENDING",
       "payment_method": "VNPAY",
       "payment_status": "SUCCESS"
     }
   }
   ```

---

### Bước 3: Admin chọn trạng thái mới và nhấn "Cập nhật"

**Frontend:** `order-detail-modal.component.html`
```html
<select [(ngModel)]="selectedStatus">
  <option value="PENDING">Chờ xác nhận</option>
  <option value="CONFIRMED">Đã xác nhận</option>
  <option value="PROCESSING">Đang xử lý</option>
  <option value="SHIPPING">Đang giao</option>
  <option value="DELIVERED">Giao hàng thành công</option>
  <option value="CANCELLED">Hủy đơn</option>
</select>

<button (click)="updateStatus()">Cập nhật trạng thái</button>
```

**Component:** `order-detail-modal.component.ts`
```typescript
updateStatus() {
  if (!this.selectedStatus) {
    alert('Vui lòng chọn trạng thái');
    return;
  }

  this.loading = true;
  this.orderService.updateOrderStatus(this.order._id, this.selectedStatus)
    .subscribe({
      next: (response) => {
        alert('Cập nhật trạng thái thành công!');
        this.order.status = response.order.status;  // Cập nhật UI
        this.loading = false;
        // Đóng modal hoặc reload danh sách
      },
      error: (error) => {
        alert('Lỗi khi cập nhật trạng thái');
        this.loading = false;
      }
    });
}
```

---

### Bước 4: Backend xử lý cập nhật trạng thái

**Route:** `order.admin.routes.js`
```javascript
router.put("/:id/status", updateOrderStatus);
```

**Controller:** `order.admin.controller.js` - hàm `updateOrderStatus()`

**Các bước xử lý:**

1. **Validate trạng thái mới**
   ```javascript
   const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
   if (!status || !validStatuses.includes(status)) {
     return error: "Trạng thái không hợp lệ"
   }
   ```

2. **Tìm đơn hàng**
   ```javascript
   const order = await Oders.findById(orderId);
   if (!order) {
     return error: "Không tìm thấy đơn hàng"
   }
   ```

3. **Kiểm tra ràng buộc**
   ```javascript
   // Không cho phép thay đổi đơn đã hủy
   if (order.status === 'CANCELLED' && status !== 'CANCELLED') {
     return error: "Không thể thay đổi trạng thái đơn hàng đã bị hủy"
   }
   
   // Không cho phép thay đổi đơn đã giao hàng
   if (order.status === 'DELIVERED' && status !== 'DELIVERED') {
     return error: "Không thể thay đổi trạng thái đơn hàng đã giao hàng"
   }
   ```

4. **Xử lý đặc biệt: Hủy đơn hàng**
   ```javascript
   if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
     // Hoàn lại tồn kho cho tất cả sản phẩm
     const orderDetails = await OdersDetails.find({ order_id: orderId });
     
     for (const item of orderDetails) {
       await ProductsVariant.findByIdAndUpdate(item.variant_id, {
         $inc: { quantity: item.quantity }  // Tăng lại số lượng
       });
     }
   }
   ```

5. **Xử lý đặc biệt: COD + Giao hàng thành công**
   ```javascript
   // Tự động chuyển payment_status từ PENDING → SUCCESS
   if (status === 'DELIVERED' && 
       order.payment_method === 'COD' && 
       order.payment_status === 'PENDING') {
     order.payment_status = 'SUCCESS';
   }
   ```

6. **Cập nhật trạng thái**
   ```javascript
   order.status = status;
   await order.save();  // Lưu vào database
   ```

7. **Trả về kết quả**
   ```json
   {
     "success": true,
     "message": "Cập nhật trạng thái đơn hàng thành công",
     "order": {
       "_id": "abc123",
       "order_code": "ORD20241201001",
       "status": "CONFIRMED",
       "payment_status": "SUCCESS",
       "updatedAt": "2024-12-01T11:00:00.000Z"
     }
   }
   ```

---

## 📊 SƠ ĐỒ LUỒNG DỮ LIỆU

```
┌─────────────┐
│  Customer   │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. Thêm vào giỏ hàng
       ▼
┌─────────────────┐
│  Cart (CART)     │ ← Tồn kho bị giảm (reserve)
│  - status: CART  │
└──────┬──────────┘
       │
       │ 2. Checkout (COD/VNPay)
       ▼
┌─────────────────┐
│  Order (PENDING)│ ← status: CART → PENDING
│  - status: PENDING│
│  - payment_status: INIT/PENDING│
└──────┬──────────┘
       │
       │ 3. VNPay callback (nếu VNPay)
       ▼
┌─────────────────┐
│  Order (PENDING)│ ← payment_status: PENDING → SUCCESS
│  - status: PENDING│
│  - payment_status: SUCCESS│
└──────┬──────────┘
       │
       │ 4. Admin xem danh sách
       ▼
┌─────────────────┐
│  GET /api/admin/│
│  orders         │ → Trả về danh sách đơn hàng
└──────┬──────────┘
       │
       │ 5. Admin xem chi tiết
       ▼
┌─────────────────┐
│  GET /api/admin/│
│  orders/:id     │ → Trả về chi tiết đơn hàng
└──────┬──────────┘
       │
       │ 6. Admin cập nhật trạng thái
       ▼
┌─────────────────┐
│  PUT /api/admin/│
│  orders/:id/    │
│  status         │ → Cập nhật status
└─────────────────┘
       │
       │ 7. Logic đặc biệt
       ▼
   ┌───┴───┐
   │      │
   ▼      ▼
┌─────┐ ┌──────────┐
│CANCEL│ │ DELIVERED│
│→ Hoàn│ │ (COD)    │
│tồn kho│ │→ payment_│
│      │ │ status:  │
│      │ │ SUCCESS  │
└─────┘ └──────────┘
```

---

## 🔑 CÁC TRẠNG THÁI QUAN TRỌNG

### Trạng thái đơn hàng (status):
- **CART**: Giỏ hàng (chưa checkout)
- **PENDING**: Chờ xác nhận (vừa đặt hàng)
- **CONFIRMED**: Đã xác nhận (admin đã xác nhận)
- **PROCESSING**: Đang xử lý / Chuẩn bị hàng
- **SHIPPING**: Đang giao hàng
- **DELIVERED**: Giao hàng thành công
- **CANCELLED**: Đơn bị hủy

### Trạng thái thanh toán (payment_status):
- **INIT**: Khởi tạo (chưa thanh toán)
- **PENDING**: Đang chờ thanh toán
- **SUCCESS**: Thanh toán thành công
- **FAILED**: Thanh toán thất bại

### Phương thức thanh toán (payment_method):
- **VNPAY**: Thanh toán online qua VNPay
- **COD**: Thanh toán khi nhận hàng

---

## 💡 LƯU Ý QUAN TRỌNG

1. **Tồn kho (Stock) được quản lý như thế nào?**
   - Khi thêm vào giỏ → Tồn kho giảm ngay (reserve mechanism)
   - Khi hủy đơn → Tồn kho được hoàn lại
   - Khi checkout thành công → Tồn kho giữ nguyên (đã reserve rồi)

2. **COD payment_status tự động cập nhật:**
   - Khi admin đổi status → `DELIVERED`
   - Nếu `payment_method = 'COD'` và `payment_status = 'PENDING'`
   - → Tự động chuyển `payment_status = 'SUCCESS'`

3. **Bảo mật:**
   - Tất cả API admin đều yêu cầu `authMiddleware` và `isAdmin`
   - Chỉ admin mới có quyền xem và cập nhật đơn hàng

4. **Phân trang:**
   - Mặc định: 10 đơn/trang
   - Có thể filter theo status, payment_status, payment_method
   - Có thể search theo mã đơn, tên, SĐT

---

## 🎓 TÓM TẮT CHO SINH VIÊN

**Quy trình đơn giản:**
1. Khách hàng đặt hàng → Tạo đơn với `status = PENDING`
2. Admin mở trang quản lý → Gọi API `GET /api/admin/orders` → Hiển thị danh sách
3. Admin click "Xem chi tiết" → Gọi API `GET /api/admin/orders/:id` → Hiển thị modal
4. Admin chọn trạng thái mới → Gọi API `PUT /api/admin/orders/:id/status` → Cập nhật database
5. Frontend reload danh sách → Hiển thị trạng thái mới

**Công nghệ sử dụng:**
- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Frontend:** Angular (TypeScript)
- **API:** RESTful API
- **Authentication:** JWT Token

---

**Tài liệu này giúp bạn hiểu rõ cách hệ thống hoạt động từ đầu đến cuối!** 🎉

