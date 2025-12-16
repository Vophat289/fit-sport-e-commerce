import express from 'express';
import passport from 'passport'; // Đã sửa lỗi: Dùng import thay cho require
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { getAllUsers } from '../controllers/auth.controller.js';
import { blockUser, changeUserRole, generateToken } from "../controllers/auth.controller.js";
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

import {
  register,
  login,
  verifyPin,
  verifyResetPin,
  logout,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fitsport_2025';

const router = express.Router();

router.get('/users', authMiddleware, adminMiddleware, getAllUsers);
//  authMiddleware, adminMiddleware,  

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post("/verify-pin", verifyPin);

// quên mật khẩu bằng mã PIN
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-reset-pin', verifyResetPin);

// chặn/bỏ chặn tài khoản (admin)
router.put('/users/:id/block', authMiddleware, isAdmin, blockUser); // authMiddleware, isAdmin,

//  phân quyền (admin)
router.put('/users/:id/role', authMiddleware, isAdmin, changeUserRole); //  authMiddleware, isAdmin,

// router.put('/users/:id/unblock', authMiddleware, isAdmin,  blockUser); // authMiddleware, isAdmin,


router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.FRONTEND_URL || 'https://fitsport.io.vn/login'
  }),
  (req, res) => {
    const user = req.user;

    // Tạo access token (thời hạn ngắn - 1 giờ)
    const accessToken = generateToken(user, '1h');

    // Tạo refresh token (thời hạn dài - 30 ngày)
    const refreshToken = generateToken(user, '30d');

    // Lưu refresh token vào session thay vì URL
    req.session.refreshToken = refreshToken;
    req.session.accessToken = accessToken;
    req.session.userId = user._id.toString();

    const frontendUrl = process.env.FRONTEND_URL || 'https://fitsport.io.vn';

    // Chỉ redirect với session ID, không có token trong URL
    res.redirect(`${frontendUrl}/auth/callback`);
  }
);

// Route mới để lấy token từ session sau khi callback
router.get('/session-data', (req, res) => {
  if (!req.session.accessToken || !req.session.userId) {
    return res.status(401).json({ message: 'Không tìm thấy session' });
  }

  // Lấy user data
  User.findById(req.session.userId).then(user => {
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    const { password: _, ...safeUser } = user.toObject();

    res.json({
      accessToken: req.session.accessToken,
      refreshToken: req.session.refreshToken,
      user: safeUser
    });

    // Xóa token khỏi session sau khi đã gửi về client
    delete req.session.accessToken;
    delete req.session.refreshToken;
    delete req.session.userId;
  }).catch(error => {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  });
});

// Route để refresh access token
router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token không được cung cấp' });
  }

  try {
    // Verify refresh token
    const payload = jwt.verify(refreshToken, JWT_SECRET);

    // Tìm user
    User.findById(payload._id).then(user => {
      if (!user) {
        return res.status(404).json({ message: 'User không tồn tại' });
      }

      if (user.isBlocked) {
        return res.status(403).json({ message: 'Tài khoản bị chặn' });
      }

      // Tạo access token mới
      const newAccessToken = generateToken(user, '1h');

      res.json({
        accessToken: newAccessToken,
        message: 'Token đã được làm mới'
      });
    }).catch(error => {
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token đã hết hạn, vui lòng đăng nhập lại' });
    }
    return res.status(401).json({ message: 'Refresh token không hợp lệ' });
  }
});


export default router;