#!/bin/bash

# Script sửa lỗi 502 Bad Gateway
# Chạy trên server: bash fix-nginx-502.sh

echo "🔧 Sửa lỗi 502 Bad Gateway..."
echo ""

# 1. Kiểm tra backend có chạy không
echo "📋 1. Kiểm tra backend:"
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Backend đang chạy và phản hồi"
    curl -s http://localhost:3000/api/health
else
    echo "❌ Backend KHÔNG phản hồi!"
    echo "🔄 Đang restart backend..."
    docker-compose restart backend
    sleep 10
fi

# 2. Kiểm tra Nginx config
echo ""
echo "📋 2. Kiểm tra Nginx config:"
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx config hợp lệ"
else
    echo "❌ Nginx config có lỗi!"
    sudo nginx -t
fi

# 3. Kiểm tra Nginx đang proxy đến đâu
echo ""
echo "📋 3. Kiểm tra Nginx proxy config:"
if [ -f "/etc/nginx/sites-available/fitsport.io.vn" ]; then
    echo "✅ Config file tồn tại"
    echo "   Proxy pass settings:"
    grep -A 2 "location /api/" /etc/nginx/sites-available/fitsport.io.vn | grep proxy_pass
else
    echo "❌ Config file không tồn tại!"
    echo "💡 Cần copy config file"
fi

# 4. Kiểm tra Nginx có chạy không
echo ""
echo "📋 4. Kiểm tra Nginx service:"
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx đang chạy"
else
    echo "❌ Nginx KHÔNG chạy!"
    echo "🔄 Đang khởi động Nginx..."
    sudo systemctl start nginx
fi

# 5. Test kết nối từ Nginx đến backend
echo ""
echo "📋 5. Test kết nối backend từ host:"
curl -v http://localhost:3000/api/health 2>&1 | head -10

# 6. Restart Nginx
echo ""
echo "📋 6. Restart Nginx..."
sudo systemctl restart nginx
sleep 2

# 7. Kiểm tra lại
echo ""
echo "📋 7. Kiểm tra sau khi restart:"
if curl -s http://localhost/api/health > /dev/null; then
    echo "✅ API qua Nginx hoạt động!"
    curl -s http://localhost/api/health
else
    echo "❌ Vẫn còn lỗi!"
    echo "💡 Xem Nginx error logs:"
    echo "   sudo tail -20 /var/log/nginx/error.log"
fi

echo ""
echo "✅ Hoàn tất!"

