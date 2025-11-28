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

# Pull latest code
echo "📥 Pulling latest code from repository..."
git pull origin main || {
    echo -e "${YELLOW}⚠️  Git pull failed or not in a git repository. Continuing anyway...${NC}"
}

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Remove old images (optional - uncomment if needed)
# echo "🗑️  Removing old images..."
# docker-compose down --rmi all

# Build images
echo "🔨 Building Docker images..."
docker-compose build --no-cache

# Start containers
echo "🚢 Starting containers..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check container status
echo "📊 Container status:"
docker-compose ps

# Show logs
echo ""
echo "📋 Recent logs:"
docker-compose logs --tail=50

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
