import express from 'express';
import passport from 'passport'; // Đã sửa lỗi: Dùng import thay cho require
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
router.put('/users/:id/role',  authMiddleware, isAdmin, changeUserRole); //  authMiddleware, isAdmin,

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
    const token = generateToken(user);
    const frontendUrl = process.env.FRONTEND_URL || 'https://fitsport.io.vn';
    res.redirect(
      `${frontendUrl}/login?user=${encodeURIComponent(JSON.stringify(user))}&token=${token}`
    );
  }
);


export default router;