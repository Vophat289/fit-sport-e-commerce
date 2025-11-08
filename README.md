# fit-sport-e-commerce

Thành phần	Vai trò
multer	nhận file từ client (dạng form-data)
fs	tạm lưu file vào thư mục uploads/
cloudinary.uploader.upload()	upload file lên Cloudinary
secure_url	URL ảnh thực tế được Cloudinary trả về
MongoDB	lưu URL này vào DB
Angular	dùng src="{{cat.image}}" để hiển thị ảnh

CƠ CHẾ TẠO SP 
1. User gửi POST /api/products với { name: "Giày Chạy Bộ Nike" }
   ↓
2. Controller nhận request
   ↓
3. slugify() chuyển đổi: "Giày Chạy Bộ Nike" → "giay-chay-bo-nike"
   ↓
4. Kiểm tra slug đã tồn tại chưa (findOne)
   ↓
5. Tạo Product với slug
   ↓
6. save() → MongoDB kiểm tra unique constraint
   ↓
7. Trả về sản phẩm đã lưu (có slug)

HOẠT ĐỘNG KHI GET SẢN PHẨM THEO SLUG
1. User truy cập URL: /products/giay-chay-bo-nike
   ↓
2. Frontend gọi: getBySlug("giay-chay-bo-nike")
   ↓
3. HTTP GET: /api/products/giay-chay-bo-nike
   ↓
4. Backend route match: router.get("/:slug", getProductBySlug)
   ↓
5. Controller: findOne({ slug: "giay-chay-bo-nike" })
   ↓
6. MongoDB dùng index để tìm nhanh
   ↓
7. Trả về sản phẩm (hoặc 404 nếu không tìm thấy)