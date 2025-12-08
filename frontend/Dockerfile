# Build Angular
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Sử dụng npm ci thay vì npm install (nhanh hơn và ít tốn dung lượng hơn)
RUN npm ci --only=production=false && npm cache clean --force
COPY . .
RUN npm run build
# Dọn dẹp sau khi build để giảm dung lượng layer
RUN rm -rf node_modules

# Serve bằng Nginx
FROM nginx:alpine
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
