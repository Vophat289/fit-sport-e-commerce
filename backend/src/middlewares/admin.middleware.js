export const adminMiddleware = (req, res, next) => {
  // Kiểm tra xem req.user có tồn tại và role có phải là admin không
  if (req.user && req.user.role === 'admin') {
    next(); // cho phép tiếp tục
  } else {
    res.status(403).json({ message: 'Bạn không có quyền truy cập (chỉ admin mới được phép).' });
  }
};
