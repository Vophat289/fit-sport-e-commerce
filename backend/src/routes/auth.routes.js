import express from 'express';

import {
  register,
  login,
  verifyPin,
  logout,
  forgotPassword,
  verifyResetPin,
  resetPassword
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify', verifyPin);
router.post('/logout', logout);

// Quên mật khẩu bằng mã PIN
router.post('/forgotPassword', forgotPassword);
router.post('/verifyResetPin', verifyResetPin);
router.post('/resetPassword', resetPassword);

export default router;
