import express from 'express';
import { 
  addToCart, 
  getCart, 
  updateCartItem, 
  deleteCartItem,
  syncCart,
  checkout,
  checkoutVNPay,
  checkoutCOD
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

// Sync cart từ localStorage (set quantity chính xác)
router.post('/sync', authMiddleware, syncCart);

//checkout và tạo payment
router.post('/checkout', authMiddleware, checkout);

export default router;
