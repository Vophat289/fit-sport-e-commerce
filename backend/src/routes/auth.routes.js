import express from 'express';

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

export default router;
