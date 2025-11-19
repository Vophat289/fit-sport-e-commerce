# Build Angular
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve bằng Nginx
FROM nginx:alpine
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
