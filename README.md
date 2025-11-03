# fit-sport-e-commerce

Thành phần	Vai trò
multer	nhận file từ client (dạng form-data)
fs	tạm lưu file vào thư mục uploads/
cloudinary.uploader.upload()	upload file lên Cloudinary
secure_url	URL ảnh thực tế được Cloudinary trả về
MongoDB	lưu URL này vào DB
Angular	dùng src="{{cat.image}}" để hiển thị ảnh