#!/bin/bash

# Script để dọn dẹp Docker trên server
# Sử dụng: ./cleanup-docker.sh

set -e

echo "🧹 Cleaning up Docker to free disk space..."
echo ""

# Kiểm tra dung lượng đĩa trước
echo "📊 Disk space BEFORE cleanup:"
df -h | head -2
echo ""

# Dừng tất cả containers
echo "🛑 Stopping all containers..."
docker stop $(docker ps -aq) 2>/dev/null || echo "No containers to stop"

# Xóa tất cả containers đã dừng
echo "🗑️  Removing stopped containers..."
docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"

# Xóa tất cả images không được sử dụng
echo "🗑️  Removing unused images..."
docker image prune -af

# Xóa tất cả volumes không được sử dụng
echo "🗑️  Removing unused volumes..."
docker volume prune -af

# Xóa tất cả networks không được sử dụng
echo "🗑️  Removing unused networks..."
docker network prune -af

# Dọn dẹp toàn bộ system
echo "🧹 Full system cleanup..."
docker system prune -af --volumes

# Kiểm tra dung lượng đĩa sau
echo ""
echo "📊 Disk space AFTER cleanup:"
df -h | head -2
echo ""

echo "✅ Cleanup completed!"

