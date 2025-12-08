#!/bin/bash

# Script để kiểm tra và sửa backend trên server EC2
# Chạy trên server: bash fix-backend.sh

set -e

echo "🔧 Kiểm tra và sửa backend server..."
echo ""

# Màu sắc
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Kiểm tra Docker containers
echo "📋 1. Kiểm tra Docker containers:"
cd ~/fit-sport-e-commerce || cd /home/ubuntu/fit-sport-e-commerce

if ! docker ps | grep -q "backend"; then
    echo -e "${RED}❌ Backend container KHÔNG chạy!${NC}"
    echo "🔄 Đang khởi động lại containers..."
    docker-compose down
    docker-compose up -d
    
    echo "⏳ Đợi 15 giây để containers khởi động..."
    sleep 15
else
    echo -e "${GREEN}✅ Backend container đang chạy${NC}"
fi

# 2. Kiểm tra logs backend
echo ""
echo "📋 2. Kiểm tra logs backend (10 dòng cuối):"
docker-compose logs --tail=10 backend

# 3. Kiểm tra backend có phản hồi không
echo ""
echo "📋 3. Kiểm tra backend health check:"
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✅ Backend phản hồi OK${NC}"
    curl -s http://localhost:3000/api/health | head -1
else
    echo -e "${RED}❌ Backend KHÔNG phản hồi!${NC}"
    echo "🔍 Xem logs chi tiết:"
    docker-compose logs --tail=50 backend
    echo ""
    echo "🔄 Đang restart backend..."
    docker-compose restart backend
    sleep 10
fi

# 4. Kiểm tra MongoDB connection
echo ""
echo "📋 4. Kiểm tra MongoDB connection trong logs:"
if docker-compose logs backend | grep -q "Kết nối MongoDB thành công"; then
    echo -e "${GREEN}✅ MongoDB đã kết nối${NC}"
else
    echo -e "${RED}❌ MongoDB chưa kết nối!${NC}"
    echo "💡 Kiểm tra file .env có MONGO_URI đúng không:"
    echo "   cat backend/.env | grep MONGO_URI"
fi

# 5. Kiểm tra Nginx
echo ""
echo "📋 5. Kiểm tra Nginx:"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx đang chạy${NC}"
    
    # Test nginx config
    if sudo nginx -t 2>&1 | grep -q "successful"; then
        echo -e "${GREEN}✅ Nginx config hợp lệ${NC}"
    else
        echo -e "${RED}❌ Nginx config có lỗi!${NC}"
        sudo nginx -t
    fi
else
    echo -e "${RED}❌ Nginx KHÔNG chạy!${NC}"
    echo "🔄 Đang khởi động Nginx..."
    sudo systemctl start nginx
fi

# 6. Kiểm tra ports
echo ""
echo "📋 6. Kiểm tra ports:"
if netstat -tuln 2>/dev/null | grep -q ":3000 " || ss -tuln 2>/dev/null | grep -q ":3000 "; then
    echo -e "${GREEN}✅ Port 3000 đang được sử dụng${NC}"
else
    echo -e "${RED}❌ Port 3000 KHÔNG được sử dụng!${NC}"
fi

# 7. Test API endpoints
echo ""
echo "📋 7. Test API endpoints:"
echo "   Testing /api/health:"
if curl -s http://localhost:3000/api/health | grep -q "OK"; then
    echo -e "   ${GREEN}✅ /api/health OK${NC}"
else
    echo -e "   ${RED}❌ /api/health FAILED${NC}"
fi

echo "   Testing /api/products:"
if curl -s http://localhost:3000/api/products > /dev/null; then
    echo -e "   ${GREEN}✅ /api/products OK${NC}"
else
    echo -e "   ${RED}❌ /api/products FAILED${NC}"
fi

# 8. Hiển thị container status
echo ""
echo "📋 8. Container status:"
docker-compose ps

echo ""
echo -e "${GREEN}✅ Kiểm tra hoàn tất!${NC}"
echo ""
echo "💡 Nếu vẫn có lỗi, chạy các lệnh sau:"
echo "   1. docker-compose logs backend (xem logs chi tiết)"
echo "   2. docker-compose restart backend (restart backend)"
echo "   3. docker-compose down && docker-compose up -d (restart tất cả)"
echo "   4. sudo systemctl restart nginx (restart nginx)"

