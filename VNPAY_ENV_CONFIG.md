# 🔧 Cấu hình Environment Variables cho VNPay trên Production

## ❌ Vấn đề
Khi deploy lên production (fitsport.io.vn), thanh toán VNPay bị lỗi "Lỗi server khi xử lý thanh toán" nhưng local thì chạy được.

## ✅ Nguyên nhân
1. **Thiếu `vnp_IpUrl`** trong `buildPayment` - VNPay cần IPN URL để gửi callback về backend
2. **Environment variables trên EC2 chưa đúng** - Các URL còn trỏ về localhost

## 📝 Các biến môi trường cần thiết

### File: `backend/.env` trên EC2

```bash
# ============================================
# VNPay Configuration (QUAN TRỌNG!)
# ============================================
# Return URL: URL mà VNPay redirect về sau khi user thanh toán xong
VNP_RETURNURL=https://fitsport.io.vn/api/vnpay/return

# IPN URL: URL mà VNPay gửi callback để cập nhật trạng thái thanh toán
VNP_IPNURL=https://fitsport.io.vn/api/vnpay/ipn

# VNPay Credentials
VNP_TMNCODE=your_tmn_code_here
VNP_HASHSECRET=your_hash_secret_here

# ============================================
# Application URLs
# ============================================
# Frontend URL: URL của website frontend
FRONTEND_URL=https://fitsport.io.vn

# Backend URL: URL của backend API (dùng cho OAuth callback)
BACKEND_URL=https://fitsport.io.vn

# ============================================
# Database & Other Configs
# ============================================
# ... (các config khác)
```

## 🔍 Kiểm tra trên EC2

### 1. SSH vào EC2
```bash
ssh ubuntu@your-ec2-ip
```

### 2. Kiểm tra file .env
```bash
cd ~/fit-sport-e-commerce
cat backend/.env | grep -E "VNP_|FRONTEND_URL|BACKEND_URL"
```

### 3. Sửa file .env nếu cần
```bash
nano backend/.env
```

**Đảm bảo các giá trị sau:**
- ✅ `VNP_RETURNURL=https://fitsport.io.vn/api/vnpay/return`
- ✅ `VNP_IPNURL=https://fitsport.io.vn/api/vnpay/ipn`
- ✅ `FRONTEND_URL=https://fitsport.io.vn`
- ✅ `BACKEND_URL=https://fitsport.io.vn`

### 4. Restart Docker containers
```bash
cd ~/fit-sport-e-commerce
docker-compose restart backend
```

### 5. Kiểm tra logs
```bash
docker-compose logs -f backend
```

## 🧪 Test thanh toán

1. Vào website: `https://fitsport.io.vn`
2. Thêm sản phẩm vào giỏ hàng
3. Click "Thanh toán"
4. Điền thông tin và click "Thanh toán VNPay"
5. Kiểm tra:
   - ✅ Có redirect đến VNPay sandbox không?
   - ✅ Sau khi thanh toán, có redirect về `/payment-success` không?
   - ✅ Kiểm tra logs backend xem có lỗi gì không?

## 📊 Debug

### Kiểm tra VNPay config trong code
```bash
# SSH vào container backend
docker exec -it backend sh

# Kiểm tra env variables
env | grep VNP
env | grep FRONTEND
env | grep BACKEND
```

### Kiểm tra logs khi thanh toán
```bash
# Xem logs real-time
docker-compose logs -f backend

# Tìm lỗi liên quan đến VNPay
docker-compose logs backend | grep -i vnpay
docker-compose logs backend | grep -i payment
```

## ⚠️ Lưu ý

1. **HTTPS bắt buộc**: VNPay yêu cầu Return URL và IPN URL phải là HTTPS trên production
2. **Domain phải đúng**: Đảm bảo domain `fitsport.io.vn` đã được cấu hình đúng trong VNPay merchant portal
3. **Firewall**: Đảm bảo VNPay có thể gửi callback đến `https://fitsport.io.vn/api/vnpay/ipn`
4. **Test Mode**: Nếu đang dùng test mode (`testMode: true`), VNPay sẽ dùng sandbox URL

## 🔄 Sau khi sửa .env

```bash
# Restart backend để load env mới
docker-compose restart backend

# Hoặc rebuild nếu cần
docker-compose down
docker-compose up -d --build
```

