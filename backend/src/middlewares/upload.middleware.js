import multer from 'multer';
import fs from 'fs';
import path from 'path';

//tạo thư mục để lưu ảnh
const tempDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tempDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
})

const upload = multer({ storage });
export default upload;