chạy proxy để có backend: ng serve --proxy-config proxy.conf.json


Proxy = trung gian chuyển tiếp request

Frontend (localhost:4200)
    |
    | Gọi: http://localhost:4200/api/products
    |
    V
Proxy nhận thấy path bắt đầu bằng "/api"
    |
    | Chuyển tiếp đến:
    V
Backend (localhost:3000/api/products)
    |
    | Trả response về
    V
Frontend nhận được data