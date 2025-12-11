#!/bin/bash

# Deployment Script for FitSport E-commerce
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment for FitSport E-commerce..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f "./backend/.env" ]; then
    echo -e "${RED}❌ Error: backend/.env file not found!${NC}"
    echo -e "${YELLOW}Please create it from backend/.env.example${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment file found${NC}"

# Backup .env file if exists
if [ -f "./backend/.env" ]; then
    echo "💾 Backing up .env file..."
    cp ./backend/.env ./backend/.env.backup
    # Tell git to ignore local .env changes
    git update-index --assume-unchanged backend/.env 2>/dev/null || true
fi

# Pull latest code
echo "📥 Pulling latest code from repository..."
# Cấu hình Git để tự động merge khi có divergent branches
git config pull.rebase false 2>/dev/null || true
# Fetch và merge
git fetch origin main
git merge origin/main --no-edit || {
    echo -e "${YELLOW}⚠️  Git merge failed. Resetting to origin/main...${NC}"
    # Nếu merge thất bại, reset về origin/main (mất local changes)
    git reset --hard origin/main
}

# Restore .env file if backup exists
if [ -f "./backend/.env.backup" ]; then
    echo "♻️  Restoring .env file..."
    cp ./backend/.env.backup ./backend/.env
    rm ./backend/.env.backup
    git update-index --assume-unchanged backend/.env 2>/dev/null || true
fi

# Check disk space before deployment
echo "📊 Checking disk space..."
df -h | head -2

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Clean up Docker để giải phóng dung lượng
echo "🧹 Cleaning up Docker (removing unused images, containers, networks)..."
docker system prune -af --volumes || true

# Remove dangling images
echo "🗑️  Removing dangling images..."
docker image prune -af || true

# Build images
echo "🔨 Building Docker images..."
docker-compose build --no-cache

# Show disk space after cleanup
echo "📊 Disk space after cleanup:"
df -h | head -2

# Start containers
echo "🚢 Starting containers..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 15

# Check container status
echo "📊 Container status:"
docker-compose ps

# Check backend health
echo ""
echo "🔍 Checking backend health..."
for i in {1..5}; do
    if curl -s http://localhost:3000/api/health > /dev/null; then
        echo -e "${GREEN}✅ Backend is healthy!${NC}"
        curl -s http://localhost:3000/api/health
        break
    else
        echo "⏳ Waiting for backend... (attempt $i/5)"
        sleep 5
    fi
done

# Show logs
echo ""
echo "📋 Recent logs:"
docker-compose logs --tail=50

# Check if backend is running
echo ""
echo "🔍 Final backend check:"
if docker ps | grep -q "backend"; then
    echo -e "${GREEN}✅ Backend container is running${NC}"
else
    echo -e "${RED}❌ Backend container is NOT running!${NC}"
    echo "📋 Backend logs:"
    docker-compose logs --tail=20 backend
fi

echo ""
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo "🌐 Your application should be available at:"
echo "   Frontend: http://localhost or https://fitsport.io.vn"
echo "   Backend:  http://localhost/api"
echo ""
echo "📝 To view logs, run:"
echo "   docker-compose logs -f"
echo ""
echo "🔍 To check status, run:"
echo "   docker-compose ps"
