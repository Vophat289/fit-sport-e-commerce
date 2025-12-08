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

# Kiểm tra SSH key
SSH_KEY="${SSH_KEY:-$HOME/Downloads/n8n_keypair.pem}"

if [ ! -f "$SSH_KEY" ]; then
    echo -e "${YELLOW}⚠️  SSH key not found: $SSH_KEY${NC}"
    echo -e "${YELLOW}💡 Trying without key (if already configured)...${NC}"
    SSH_CMD="ssh"
else
    chmod 600 "$SSH_KEY" 2>/dev/null || true
    SSH_CMD="ssh -i $SSH_KEY"
    echo "🔑 Using SSH key: $SSH_KEY"
fi

# SSH vào server và deploy
$SSH_CMD ${EC2_USER}@${EC2_HOST} << 'EOF'
  set -e
  
  echo "📂 Navigating to project directory..."
  cd ~/fit-sport-e-commerce
  
  echo "📥 Pulling latest code from main branch..."
  # Cấu hình Git để tự động merge khi có divergent branches
  git config pull.rebase false 2>/dev/null || true
  # Fetch và merge
  git fetch origin main
  git merge origin/main --no-edit || {
    echo "⚠️  Git merge failed. Resetting to origin/main..."
    git reset --hard origin/main
  }
  
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
