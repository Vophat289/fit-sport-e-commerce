🏗️ Kiến trúc hệ thống (Architecture)
Trước khi đi vào chi tiết file, hãy hình dung luồng dữ liệu khi một người dùng truy cập vào web của bạn:

mermaid
graph TD
    User[Người dùng (Browser)] -->|HTTPS (443)| SystemNginx[System Nginx (Trên EC2)]
    
    subgraph "Docker Containers"
        SystemNginx -->|/ (Trang chủ)| Frontend[Frontend Container (Angular)]
        SystemNginx -->|/api (Dữ liệu)| Backend[Backend Container (Node.js)]
        Backend -->|Connect| DB[(MongoDB Atlas)]
    end
Cơ chế:

System Nginx là "người gác cổng", nhận mọi yêu cầu từ bên ngoài.
Nếu khách hỏi trang web (/), nó chuyển tiếp vào Frontend Container.
Nếu khách hỏi dữ liệu (/api), nó chuyển tiếp vào Backend Container.
Frontend và Backend nằm trong các hộp kín (Docker Containers), tách biệt và an toàn.
📂 Giải thích chi tiết các thay đổi
Dưới đây là các file chúng ta đã can thiệp, sắp xếp theo đúng lộ trình triển khai:

1. Giai đoạn chuẩn bị Container (Docker)
Mục tiêu: Đóng gói code vào các "hộp" để chạy được trên mọi máy.

🛠️ 
backend/Dockerfile
Thay đổi: Bỏ cờ --production trong lệnh npm install.
Tại sao?: Backend của bạn dùng thư viện nodemon để chạy. nodemon thường là devDependency. Nếu dùng --production, Docker sẽ không cài nó -> Backend không khởi động được.
Bài học: Với Docker production, tốt nhất nên dùng lệnh node server.js thay vì nodemon (nhưng để chạy được ngay thì sửa như trên là nhanh nhất).
🛠️ 
frontend/Dockerfile
 & 
frontend/nginx.conf
 (MỚI)
Thay đổi:
Tạo file 
nginx.conf
 có đoạn try_files $uri $uri/ /index.html;.
Sửa Dockerfile để copy file này vào container.
Cơ chế: Angular là SPA (Single Page Application). Khi bạn F5 ở trang /products, thực chất không có file nào tên là products cả.
Tác dụng: Cấu hình này bảo Nginx: "Nếu không tìm thấy file, hãy trả về 
index.html
 để Angular tự xử lý routing". Đây là lý do fix được lỗi 404 Not Found.
🛠️ 
docker-compose.yml
Thay đổi:
Xóa service nginx: Vì chúng ta đã cài Nginx trực tiếp trên EC2 (System Nginx) để quản lý SSL dễ hơn. Nếu để cả 2 cái cùng chạy cổng 80 sẽ bị xung đột ("Address already in use").
Sửa depends_on: Bỏ condition: service_healthy vì backend khởi động hơi lâu, khiến frontend chờ mãi không được nên tự tắt. Giờ frontend cứ chạy lên, backend lên sau cũng được.
2. Giai đoạn kết nối Code (Frontend <-> Backend)
Mục tiêu: Đảm bảo 2 container nói chuyện được với nhau trên môi trường mạng thật.

🛠️ frontend/src/.../*.ts (Các file Service)
Thay đổi: Thay thế http://localhost:3000 thành đường dẫn tương đối (ví dụ /api/products).
Cơ chế:
Trên máy bạn: localhost là máy tính của bạn.
Trên EC2: localhost của người dùng là... máy tính của người dùng! Backend không nằm ở đó.
Khi dùng đường dẫn tương đối (bỏ domain), trình duyệt sẽ gọi vào https://fitsport.io.vn/api/.... Nginx sẽ hứng request này và chuyển đúng về Backend.
🛠️ 
backend/src/app.js
Thay đổi: Cập nhật cors cho phép https://fitsport.io.vn.
Cơ chế: Trình duyệt có cơ chế bảo mật CORS. Nếu Backend không "gật đầu" (allow origin) cho domain fitsport.io.vn, trình duyệt sẽ chặn không cho Frontend lấy dữ liệu.
🛠️ 
frontend/angular.json
Thay đổi: Tăng budgets (dung lượng cho phép).
Tại sao?: Code Angular khi build ra khá nặng. Mặc định nó giới hạn cảnh báo. Chúng ta tăng lên để build không bị lỗi "Size limit exceeded".
3. Giai đoạn triển khai & Public (System Nginx)
Mục tiêu: Đưa web ra internet với tên miền và bảo mật.

🛠️ 
nginx/fitsport.io.vn.conf
 (Trên EC2)
Thay đổi: File cấu hình chính cho server.
Cơ chế:
location /: Chuyển tiếp (proxy_pass) vào cổng 4200 (Frontend).
location /api: Chuyển tiếp vào cổng 3000 (Backend).
Certbot tự động thêm các dòng cấu hình SSL (443) vào đây.
🚀 Tổng kết quy trình "Lên Production"
Build: Đóng gói code thành Docker Image (sửa Dockerfile, angular.json).
Config: Cấu hình môi trường (sửa API URL, CORS, docker-compose).
Deploy: Đẩy code lên Server, chạy docker-compose up.
Route: Cấu hình Nginx để điều phối luồng đi (Frontend hay Backend).
Secure: Cài SSL để có HTTPS.
Bạn đã làm chủ được quy trình này rồi đó! Hệ thống hiện tại rất chuẩn: Dễ mở rộng (Docker), Bảo mật (SSL/CORS), và Ổn định (Nginx Reverse Proxy). 🏆