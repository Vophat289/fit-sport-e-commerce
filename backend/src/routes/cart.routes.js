import express from 'express';
import { 
  addToCart, 
  getCart, 
  updateCartItem, 
  deleteCartItem 
} from '../controllers/cart.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Thêm sản phẩm vào giỏ hàng
router.post('/add', authMiddleware, addToCart);

// Xem giỏ hàng
router.get('/', authMiddleware, getCart);

// Cập nhật số lượng sản phẩm trong giỏ
router.patch('/update/:itemId', authMiddleware, updateCartItem);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/delete/:itemId', authMiddleware, deleteCartItem);

export default router;
