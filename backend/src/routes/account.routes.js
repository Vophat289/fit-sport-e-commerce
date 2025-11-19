import express from 'express';
import {
  getProfile, updateProfile,
  getAddresses, createAddress, updateAddress, deleteAddress
} from '../controllers/account.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// PROFILE
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

// ADDRESSES
router.get('/addresses', authMiddleware, getAddresses);
router.post('/addresses', authMiddleware, createAddress);
router.put('/addresses/:id', authMiddleware, updateAddress);
router.delete('/addresses/:id', authMiddleware, deleteAddress);

export default router;
