#!/bin/bash

# Script để SSH vào server và sửa backend
# Chạy từ local: ./fix-backend-remote.sh

set -e

# Cấu hình
EC2_HOST="3.27.137.100"
EC2_USER="ubuntu"
SSH_KEY="${SSH_KEY:-$HOME/Downloads/n8n_keypair.pem}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔧 Fixing backend on EC2 server...${NC}"
echo ""

# Kiểm tra SSH key
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ SSH key not found: $SSH_KEY${NC}"
    echo -e "${YELLOW}💡 Set SSH_KEY environment variable or place key at: $SSH_KEY${NC}"
    echo "   Example: SSH_KEY=~/path/to/key.pem ./fix-backend-remote.sh"
    exit 1
fi

# Set permissions cho SSH key
chmod 600 "$SSH_KEY" 2>/dev/null || true

echo "🔑 Using SSH key: $SSH_KEY"
echo ""

# SSH vào server và fix
ssh -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} << 'EOF'
  set -e
  
  echo "📂 Navigating to project directory..."
  cd ~/fit-sport-e-commerce
  
  echo ""
  echo "📋 1. Checking container status..."
  docker-compose ps
  
  echo ""
  echo "📋 2. Checking if backend container is running..."
  if docker ps | grep -q "backend"; then
    echo "✅ Backend container is running"
  else
    echo "❌ Backend container is NOT running!"
    echo "🔄 Starting containers..."
    docker-compose up -d
    sleep 15
  fi
  
  echo ""
  echo "📋 3. Checking backend health..."
  for i in {1..3}; do
    if curl -s http://localhost:3000/api/health > /dev/null; then
      echo "✅ Backend is healthy!"
      curl -s http://localhost:3000/api/health
      break
    else
      echo "⏳ Waiting for backend... (attempt $i/3)"
      sleep 5
    fi
  done
  
  echo ""
  echo "📋 4. Recent backend logs:"
  docker-compose logs --tail=20 backend
  
  echo ""
  echo "📋 5. Checking MongoDB connection..."
  if docker-compose logs backend | grep -q "Kết nối MongoDB thành công"; then
    echo "✅ MongoDB connected"
  else
    echo "❌ MongoDB connection issue!"
    echo "Checking .env file..."
    if [ -f "backend/.env" ]; then
      echo "MONGO_URI exists: $(grep -q MONGO_URI backend/.env && echo 'YES' || echo 'NO')"
    else
      echo "❌ backend/.env file not found!"
    fi
  fi
  
  echo ""
  echo "📋 6. Restarting backend to ensure it's running..."
  docker-compose restart backend
  sleep 10
  
  echo ""
  echo "📋 7. Final check - Testing API endpoints:"
  echo "   Health check:"
  curl -s http://localhost:3000/api/health || echo "   ❌ Health check failed"
  
  echo ""
  echo "   Products API:"
  curl -s -o /dev/null -w "   Status: %{http_code}\n" http://localhost:3000/api/products || echo "   ❌ Products API failed"
  
  echo ""
  echo "📋 8. Container status after restart:"
  docker-compose ps
  
  echo ""
  echo "✅ Fix completed!"
  echo ""
  echo "💡 If backend still doesn't work, check logs:"
  echo "   docker-compose logs backend"
EOF

echo ""
echo -e "${GREEN}✅ Remote fix completed!${NC}"
echo ""
echo "🌐 Test your website: https://fitsport.io.vn"
echo "🔍 Check backend: curl https://fitsport.io.vn/api/health"

