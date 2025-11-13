import express from 'express';
import passport from 'passport'; // Đã sửa lỗi: Dùng import thay cho require

import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Quên mật khẩu bằng mã PIN
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:4200/login' }),
  (req, res) => {
    const user = req.user;
    const token = 'fake-jwt-' + user._id;
    res.redirect(
      `http://localhost:4200/login?user=${encodeURIComponent(JSON.stringify(user))}&token=${token}`
    );
  }
);


export default router;