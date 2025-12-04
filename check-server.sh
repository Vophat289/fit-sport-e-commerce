#!/bin/bash

# Script kiểm tra trạng thái server
# Chạy trên EC2 server

echo "🔍 Kiểm tra trạng thái server FitSport..."
echo ""

# Kiểm tra Nginx
echo "📋 1. Kiểm tra Nginx:"
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx đang chạy"
    sudo systemctl status nginx --no-pager | head -5
else
    echo "   ❌ Nginx KHÔNG chạy!"
    echo "   💡 Chạy: sudo systemctl start nginx"
fi
echo ""

# Kiểm tra Nginx config
echo "📋 2. Kiểm tra Nginx config:"
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "   ✅ Nginx config hợp lệ"
else
    echo "   ❌ Nginx config có lỗi!"
    sudo nginx -t
fi
echo ""

# Kiểm tra Docker containers
echo "📋 3. Kiểm tra Docker containers:"
cd ~/fit-sport-e-commerce 2>/dev/null || cd /home/ubuntu/fit-sport-e-commerce 2>/dev/null || echo "   ⚠️  Không tìm thấy thư mục project"

if command -v docker-compose &> /dev/null; then
    echo "   Container status:"
    docker-compose ps
    echo ""
    
    # Kiểm tra từng container
    if docker ps | grep -q "backend"; then
        echo "   ✅ Backend container đang chạy"
    else
        echo "   ❌ Backend container KHÔNG chạy!"
    fi
    
    if docker ps | grep -q "frontend"; then
        echo "   ✅ Frontend container đang chạy"
    else
        echo "   ❌ Frontend container KHÔNG chạy!"
    fi
else
    echo "   ⚠️  docker-compose không được cài đặt"
fi
echo ""

# Kiểm tra ports
echo "📋 4. Kiểm tra ports:"
if netstat -tuln | grep -q ":80 "; then
    echo "   ✅ Port 80 đang được sử dụng"
    netstat -tuln | grep ":80 "
else
    echo "   ❌ Port 80 KHÔNG được sử dụng!"
fi

if netstat -tuln | grep -q ":3000 "; then
    echo "   ✅ Port 3000 (backend) đang được sử dụng"
else
    echo "   ❌ Port 3000 (backend) KHÔNG được sử dụng!"
fi

if netstat -tuln | grep -q ":4200 "; then
    echo "   ✅ Port 4200 (frontend) đang được sử dụng"
else
    echo "   ❌ Port 4200 (frontend) KHÔNG được sử dụng!"
fi
echo ""

# Kiểm tra Nginx config file
echo "📋 5. Kiểm tra Nginx config file:"
if [ -f "/etc/nginx/sites-available/fitsport.io.vn" ]; then
    echo "   ✅ Config file tồn tại: /etc/nginx/sites-available/fitsport.io.vn"
    if [ -L "/etc/nginx/sites-enabled/fitsport.io.vn" ]; then
        echo "   ✅ Symlink đã được tạo"
    else
        echo "   ❌ Symlink CHƯA được tạo!"
        echo "   💡 Chạy: sudo ln -sf /etc/nginx/sites-available/fitsport.io.vn /etc/nginx/sites-enabled/"
    fi
else
    echo "   ❌ Config file KHÔNG tồn tại!"
    echo "   💡 Cần copy file nginx/fitsport.io.vn.conf lên server"
fi
echo ""

# Kiểm tra kết nối local
echo "📋 6. Kiểm tra kết nối local:"
if curl -s http://localhost:4200 > /dev/null; then
    echo "   ✅ Frontend (port 4200) phản hồi"
else
    echo "   ❌ Frontend (port 4200) KHÔNG phản hồi!"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ Backend (port 3000) phản hồi"
else
    echo "   ❌ Backend (port 3000) KHÔNG phản hồi!"
fi
echo ""

echo "✅ Kiểm tra hoàn tất!"
echo ""
echo "💡 Nếu có lỗi, hãy chạy các lệnh sau:"
echo "   1. sudo systemctl restart nginx"
echo "   2. cd ~/fit-sport-e-commerce && docker-compose up -d"
echo "   3. sudo cp ~/fit-sport-e-commerce/nginx/fitsport.io.vn.conf /etc/nginx/sites-available/fitsport.io.vn"
echo "   4. sudo ln -sf /etc/nginx/sites-available/fitsport.io.vn /etc/nginx/sites-enabled/"
echo "   5. sudo nginx -t && sudo systemctl reload nginx"

