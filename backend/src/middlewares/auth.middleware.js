import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/user.model.js'; // Đường dẫn đến model User, sửa theo dự án của bạn

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fitsport_2025';

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // Lấy user từ DB theo payload._id (hoặc payload.id, tùy bạn)
    const user = await User.findById(payload._id);

    if (!user) {
      return res.status(401).json({ message: 'User không tồn tại' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Tài khoản bị chặn' });
    }

    req.user = user; // Gán user thực cho req.user

    next();
  } catch (err) {
    console.error('Token verification failed:', err.name, err.message);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token hết hạn, hãy thử lại.' });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token sai, không đúng định dạng' });
    }

    return res.status(401).json({ message: 'Unauthorized' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
  }
};
