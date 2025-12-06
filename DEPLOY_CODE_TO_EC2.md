# 🚀 Deploy Code Mới Lên EC2

## ⚠️ Vấn đề
Logs không hiển thị các dòng log VNPay mới → Code chưa được deploy lên EC2!

## 📋 Các bước deploy

### Cách 1: Deploy từ Local (Khuyên dùng)

#### Bước 1: Commit và push code mới
```bash
# Trên máy local của bạn
cd /home/vohongphat/WorkPlaces/FPT/fit-sport-e-commerce

# Commit code mới
git add .
git commit -m "Add VNPay debug logging and validation"
git push origin main  # hoặc branch bạn đang dùng
```

#### Bước 2: Pull và deploy trên EC2
```bash
# SSH vào EC2
ssh ubuntu@your-ec2-ip

# Vào thư mục project
cd ~/fit-sport-e-commerce

# Pull code mới
git pull origin main

# Chạy deploy script
./deploy.sh
```

### Cách 2: Deploy trực tiếp trên EC2

#### Bước 1: SSH vào EC2
```bash
ssh ubuntu@your-ec2-ip
```

#### Bước 2: Pull code mới
```bash
cd ~/fit-sport-e-commerce
git pull origin main
```

#### Bước 3: Restart backend container
```bash
# Stop containers
docker-compose down

# Rebuild và start lại
docker-compose up -d --build
```

#### Bước 4: Kiểm tra logs
```bash
docker-compose logs -f backend
```

**Phải thấy:**
```
✅ VNPay instance created with TMN Code: ***VOZQ
```

### Cách 3: Dùng deploy script có sẵn

```bash
# Từ máy local
./deploy-remote.sh
```

Hoặc nếu dùng GitHub Actions:
- Push code lên GitHub
- GitHub Actions sẽ tự động deploy

## ✅ Kiểm tra sau khi deploy

### 1. Kiểm tra code đã được update chưa
```bash
# SSH vào EC2
docker exec backend cat /app/src/services/vnpay.service.js | grep "Building VNPay"
```

Phải thấy dòng: `console.log('🔧 Building VNPay payment URL with config:');`

### 2. Kiểm tra VNPay instance đã được tạo chưa
```bash
docker-compose logs backend | grep "VNPay instance"
```

Phải thấy: `✅ VNPay instance created with TMN Code: ***VOZQ`

### 3. Test lại thanh toán
1. Vào website
2. Test thanh toán
3. Xem logs phải có các dòng:
   - `💰 Creating payment URL for order:`
   - `🔧 Building VNPay payment URL with config:`
   - `✅ Payment URL created successfully`

## 🐛 Nếu vẫn không thấy logs mới

### Kiểm tra container có đang chạy code mới không:
```bash
# Xem last modified time của file
docker exec backend ls -la /app/src/services/vnpay.service.js

# Hoặc xem nội dung file
docker exec backend cat /app/src/services/vnpay.service.js | head -30
```

### Force rebuild container:
```bash
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d
```

## 📝 Lưu ý

1. **Docker cache:** Nếu không thấy thay đổi, có thể do Docker cache. Dùng `--no-cache` để build lại.

2. **Volume mount:** Kiểm tra xem code có được mount vào container không:
   ```bash
   docker-compose ps
   docker inspect backend | grep -A 10 "Mounts"
   ```

3. **Restart vs Rebuild:** 
   - `restart` chỉ restart process, không load code mới
   - `rebuild` build lại image với code mới

