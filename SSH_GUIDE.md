# 🔑 Hướng dẫn SSH vào server EC2

## Lỗi thường gặp:

### 1. ❌ Lỗi: `ssh: Could not resolve hostname i`
**Nguyên nhân:** Thiếu dấu `-` trước `i`
```bash
# ❌ SAI
ssh i ~/Downloads/n8n_keypair.pem ubuntu@3.27.137.100

# ✅ ĐÚNG
ssh -i ~/Downloads/n8n_keypair.pem ubuntu@3.27.137.100
```

### 2. ❌ Lỗi: `Permission denied (publickey)`
**Nguyên nhân:** 
- Username sai: `ubunu` → phải là `ubuntu`
- SSH key không đúng
- Key chưa được set permissions

## ✅ Cách SSH đúng:

### Cách 1: SSH với key file
```bash
# Set permissions cho key (chỉ cần làm 1 lần)
chmod 600 ~/Downloads/n8n_keypair.pem

# SSH vào server
ssh -i ~/Downloads/n8n_keypair.pem ubuntu@3.27.137.100
```

### Cách 2: Sử dụng script tự động
```bash
# Script sẽ tự động dùng key
./fix-backend-remote.sh

# Hoặc chỉ định key khác
SSH_KEY=~/path/to/your/key.pem ./fix-backend-remote.sh
```

### Cách 3: Cấu hình SSH config (khuyến nghị)
Tạo file `~/.ssh/config`:
```
Host fitsport
    HostName 3.27.137.100
    User ubuntu
    IdentityFile ~/Downloads/n8n_keypair.pem
    StrictHostKeyChecking no
```

Sau đó chỉ cần:
```bash
ssh fitsport
```

## 🔧 Sửa backend trên server:

### Sau khi SSH thành công:

```bash
# 1. Vào thư mục project
cd ~/fit-sport-e-commerce

# 2. Chạy script fix
bash fix-backend.sh

# Hoặc sửa thủ công:
# 3. Kiểm tra containers
docker-compose ps

# 4. Xem logs backend
docker-compose logs --tail=50 backend

# 5. Restart backend
docker-compose restart backend

# 6. Test health check
curl http://localhost:3000/api/health
```

## 📝 Checklist:

- [ ] SSH key có đúng path không? (`~/Downloads/n8n_keypair.pem`)
- [ ] Key đã set permissions chưa? (`chmod 600`)
- [ ] Username đúng chưa? (`ubuntu` không phải `ubunu`)
- [ ] IP address đúng chưa? (`3.27.137.100`)

## 🚨 Nếu vẫn không SSH được:

1. **Kiểm tra key có đúng không:**
```bash
file ~/Downloads/n8n_keypair.pem
# Phải hiển thị: "PEM RSA private key"
```

2. **Kiểm tra IP có đúng không:**
```bash
ping 3.27.137.100
```

3. **Kiểm tra Security Group trên AWS:**
   - Port 22 (SSH) phải được mở
   - Source IP của bạn phải được cho phép

4. **Thử SSH với verbose để debug:**
```bash
ssh -v -i ~/Downloads/n8n_keypair.pem ubuntu@3.27.137.100
```

