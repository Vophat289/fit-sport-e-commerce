import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Tải biến môi trường để truy cập JWT_SECRET trong .env
dotenv.config();
// Sử dụng JWT_SECRET từ .env
const JWT_SECRET = process.env.JWT_SECRET || 'fitsport_2025';

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        //SỬ DỤNG VERIFY để xác minh chữ ký và thời hạn
        const payload = jwt.verify(token, JWT_SECRET); 
        req.user = payload;
        next();
    } catch (err) {
        // Xử lý lỗi xác minh
        console.error('Token verification failed:', err.name, err.message);
        let errorMessage = 'Invalid token';
        if (err.name === 'TokenExpiredError') {
            // Lỗi khi token hết hạn
            errorMessage = 'Token hết hạn, hãy thử lại.';
            return res.status(401).json({ message: errorMessage });
        } else if (err.name === 'JsonWebTokenError') {
            errorMessage = 'Token sai, không đúng định dạng';
            return res.status(401).json({ message: errorMessage });
        }
        //khóa bảo mật
        return res.status(401).json({ message: errorMessage });
    }
};