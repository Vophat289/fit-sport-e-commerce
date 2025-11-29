#!/bin/bash

# Script để deploy từ local lên server EC2
# Sử dụng: ./deploy-remote.sh

set -e

# Cấu hình
EC2_HOST="3.27.137.100"
EC2_USER="ubuntu"
PROJECT_PATH="~/fit-sport-e-commerce"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying to EC2 Server...${NC}"
echo ""

# SSH vào server và deploy
ssh ${EC2_USER}@${EC2_HOST} << 'EOF'
  set -e
  
  echo "📂 Navigating to project directory..."
  cd ~/fit-sport-e-commerce
  
  echo "📥 Pulling latest code from main branch..."
  git pull origin main
  
  echo "🔨 Running deployment script..."
  ./deploy.sh
  
  echo ""
  echo "✅ Deployment completed successfully!"
  echo ""
  echo "🌐 Your application is available at:"
  echo "   https://fitsport.io.vn"
EOF

echo ""
echo -e "${GREEN}✅ Remote deployment completed!${NC}"
echo -e "${YELLOW}💡 Tip: Visit https://fitsport.io.vn to verify your changes${NC}"
