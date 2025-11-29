# HƯỚNG DẪN SETUP N8N VÀO WEB

## 📋 Tổng quan

Sau khi setup, bạn sẽ có:
- **n8n Dashboard**: `http://fitsport.io.vn/n8n/` (hoặc `http://YOUR_IP:5678`)
- **n8n Webhooks**: `http://fitsport.io.vn/webhook/...`

---

## 🚀 BƯỚC 1: CẤU HÌNH DOCKER COMPOSE

### Đã thêm n8n service vào `docker-compose.yml`:

```yaml
n8n:
  image: n8nio/n8n:latest
  container_name: n8n
  restart: always
  ports:
    - "5678:5678"
  environment:
    - N8N_BASIC_AUTH_ACTIVE=true
    - N8N_BASIC_AUTH_USER=admin
    - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD:-changeme123}
    - N8N_HOST=fitsport.io.vn
    - N8N_PROTOCOL=http
    - N8N_PORT=5678
    - WEBHOOK_URL=http://fitsport.io.vn/
    - GENERIC_TIMEZONE=Asia/Ho_Chi_Minh
  volumes:
    - n8n_data:/home/node/.n8n
  networks:
    - fitsport-network
```

### Giải thích các biến môi trường:

- **N8N_BASIC_AUTH_ACTIVE**: Bật authentication (bảo mật)
- **N8N_BASIC_AUTH_USER**: Username đăng nhập (mặc định: `admin`)
- **N8N_BASIC_AUTH_PASSWORD**: Password (có thể set trong `.env` hoặc dùng `changeme123`)
- **N8N_HOST**: Domain của bạn
- **WEBHOOK_URL**: Base URL cho webhooks
- **GENERIC_TIMEZONE**: Múi giờ (Asia/Ho_Chi_Minh)

### Tùy chọn: Tạo file `.env` để set password an toàn hơn

Tạo file `.env` ở root project (nếu chưa có):

```env
N8N_PASSWORD=your_secure_password_here
```

Sau đó update docker-compose.yml để dùng:
```yaml
- N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
```

---

## 🔧 BƯỚC 2: CẤU HÌNH NGINX

### Đã thêm vào `nginx/fitsport.io.vn.conf`:

```nginx
# N8N Dashboard
location /n8n/ {
    proxy_pass http://localhost:5678/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}

# N8N Webhooks (URL ngắn hơn)
location /webhook/ {
    proxy_pass http://localhost:5678/webhook/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
}
```

### Giải thích:

- **`/n8n/`**: Dashboard của n8n (để quản lý workflows)
- **`/webhook/`**: Webhook endpoints (để backend gọi)

---

## 🎯 BƯỚC 3: DEPLOY VÀ KHỞI ĐỘNG

### 3.1. Copy nginx config lên server:

```bash
# SSH vào EC2
ssh user@your-ec2-ip

# Copy nginx config
sudo cp /path/to/fitsport.io.vn.conf /etc/nginx/sites-available/fitsport.io.vn
sudo ln -sf /etc/nginx/sites-available/fitsport.io.vn /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 3.2. Khởi động n8n container:

```bash
cd ~/fit-sport-e-commerce

# Pull và start n8n
docker-compose up -d n8n

# Kiểm tra logs
docker-compose logs -f n8n

# Kiểm tra container đang chạy
docker-compose ps
```

### 3.3. Kiểm tra n8n đã chạy:

```bash
# Kiểm tra port 5678
curl http://localhost:5678

# Hoặc mở browser
http://fitsport.io.vn/n8n/
# hoặc
http://YOUR_EC2_IP:5678
```

---

## 🔐 BƯỚC 4: ĐĂNG NHẬP N8N

1. Mở browser: `http://fitsport.io.vn/n8n/` hoặc `http://YOUR_IP:5678`
2. Đăng nhập với:
   - **Username**: `admin`
   - **Password**: `changeme123` (hoặc password bạn đã set trong `.env`)

---

## 📝 BƯỚC 5: TẠO WORKFLOW CHATBOT

### 5.1. Tạo Workflow mới:

1. Click **"Add workflow"** hoặc **"+"**
2. Đặt tên: **"FitSport Chatbot"**

### 5.2. Thêm Webhook Node:

1. Kéo thả node **"Webhook"** vào canvas
2. Click vào node để cấu hình:
   - **HTTP Method**: `POST`
   - **Path**: `/chatbot` (hoặc tên bạn muốn)
   - **Response Mode**: `Respond to Webhook` ⚠️ QUAN TRỌNG!
   - **Response Code**: `200`

3. Click **"Listen for Test Event"** để activate webhook
4. **Copy Webhook URL** (sẽ hiển thị ở trên)
   - Ví dụ: `http://fitsport.io.vn/webhook/chatbot`
   - Hoặc: `http://YOUR_IP:5678/webhook/chatbot`

### 5.3. Xử lý Message (Có 2 cách):

#### **Cách 1: Rule-based (Đơn giản - Khuyến nghị bắt đầu)**

1. Thêm node **"IF"** sau Webhook
2. Cấu hình conditions:

   **Condition 1:**
   - Field: `{{ $json.message }}`
   - Operation: `contains`
   - Value: `xin chào` (hoặc `hello`, `hi`)

   **Condition 2:**
   - Field: `{{ $json.message }}`
   - Operation: `contains`
   - Value: `giá` (hoặc `price`)

   **Condition 3:**
   - Field: `{{ $json.message }}`
   - Operation: `contains`
   - Value: `đặt hàng` (hoặc `mua`)

3. Thêm node **"Set"** cho mỗi branch:

   **Branch 1 (xin chào):**
   - Name: `reply`
   - Value: `Xin chào! Tôi là chatbot của FitSport. Tôi có thể giúp gì cho bạn?`

   **Branch 2 (giá):**
   - Name: `reply`
   - Value: `Bạn có thể xem giá sản phẩm tại trang sản phẩm của chúng tôi: /products`

   **Branch 3 (đặt hàng):**
   - Name: `reply`
   - Value: `Bạn có thể thêm sản phẩm vào giỏ hàng và thanh toán. Cần hỗ trợ thêm không?`

   **Default (khác):**
   - Name: `reply`
   - Value: `Xin lỗi, tôi chưa hiểu. Bạn có thể liên hệ hotline: 0123456789 hoặc email: info@fitsport.io.vn`

4. Thêm node **"Respond to Webhook"** ở cuối mỗi branch:
   - **Response Body**: 
     ```json
     {
       "success": true,
       "reply": "{{ $json.reply }}"
     }
     ```

#### **Cách 2: Tích hợp AI (OpenAI/Gemini)**

1. Thêm node **"OpenAI"** hoặc **"Google Gemini"** sau Webhook
2. Cấu hình:
   - **Model**: `gpt-3.5-turbo` hoặc `gemini-pro`
   - **Prompt**: 
     ```
     Bạn là chatbot của FitSport, một cửa hàng thể thao.
     Trả lời ngắn gọn, thân thiện bằng tiếng Việt.
     Câu hỏi: {{ $json.message }}
     ```
3. Thêm node **"Set"** để format response:
   - Name: `reply`
   - Value: `{{ $json.choices[0].message.content }}` (OpenAI)
   - Hoặc: `{{ $json.text }}` (Gemini)
4. Thêm node **"Respond to Webhook"**:
   ```json
   {
     "success": true,
     "reply": "{{ $json.reply }}"
   }
   ```

### 5.4. Activate Workflow:

1. Click nút **"Active"** ở góc trên bên phải (toggle switch)
2. Workflow sẽ chạy và webhook sẵn sàng nhận request

---

## 🔗 BƯỚC 6: CẤU HÌNH BACKEND

### 6.1. Thêm N8N_WEBHOOK_URL vào `.env`:

```env
# File: backend/.env
N8N_WEBHOOK_URL=http://fitsport.io.vn/webhook/chatbot
# Hoặc nếu dùng IP trực tiếp:
# N8N_WEBHOOK_URL=http://YOUR_IP:5678/webhook/chatbot
```

### 6.2. Restart backend:

```bash
docker-compose restart backend
```

---

## ✅ BƯỚC 7: TEST

### 7.1. Test Webhook trực tiếp:

```bash
curl -X POST http://fitsport.io.vn/webhook/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "xin chào",
    "sessionId": "test123"
  }'
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "reply": "Xin chào! Tôi là chatbot của FitSport..."
}
```

### 7.2. Test từ Backend API:

```bash
curl -X POST http://fitsport.io.vn/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "xin chào",
    "sessionId": "test123"
  }'
```

### 7.3. Test từ Frontend:

1. Mở website: `http://fitsport.io.vn`
2. Click nút chat ở góc dưới bên phải
3. Gửi tin nhắn: "xin chào"
4. Kiểm tra response từ bot

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Cannot connect to n8n"

**Kiểm tra:**
```bash
# Kiểm tra container đang chạy
docker-compose ps

# Kiểm tra logs
docker-compose logs n8n

# Kiểm tra port
netstat -tulpn | grep 5678
```

**Giải pháp:**
- Restart n8n: `docker-compose restart n8n`
- Kiểm tra firewall: `sudo ufw allow 5678`

### Lỗi: "Webhook not found"

**Nguyên nhân:**
- Workflow chưa được activate
- Webhook path không đúng

**Giải pháp:**
- Vào n8n dashboard → Kiểm tra workflow đã active chưa
- Kiểm tra webhook path trong node Webhook
- Copy lại webhook URL chính xác

### Lỗi: "Response format không đúng"

**Nguyên nhân:**
- Node "Respond to Webhook" không đúng format

**Giải pháp:**
- Kiểm tra response body phải có field `reply`
- Format JSON phải đúng: `{"success": true, "reply": "..."}`

### Lỗi: "Nginx 502 Bad Gateway"

**Nguyên nhân:**
- n8n container chưa chạy
- Port 5678 bị block

**Giải pháp:**
```bash
# Kiểm tra n8n
docker-compose ps n8n

# Restart n8n
docker-compose restart n8n

# Kiểm tra nginx config
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📚 TÀI LIỆU THAM KHẢO

- **n8n Documentation**: https://docs.n8n.io/
- **n8n Community**: https://community.n8n.io/
- **n8n Workflows**: https://n8n.io/workflows/

---

## 🎯 CHECKLIST HOÀN THÀNH

- [ ] Đã thêm n8n vào docker-compose.yml
- [ ] Đã cấu hình nginx proxy
- [ ] Đã khởi động n8n container
- [ ] Đã đăng nhập vào n8n dashboard
- [ ] Đã tạo workflow chatbot
- [ ] Đã cấu hình webhook node
- [ ] Đã thêm logic xử lý message
- [ ] Đã activate workflow
- [ ] Đã thêm N8N_WEBHOOK_URL vào backend .env
- [ ] Đã restart backend
- [ ] Đã test webhook thành công
- [ ] Đã test từ frontend thành công

---

Chúc bạn setup thành công! 🚀

