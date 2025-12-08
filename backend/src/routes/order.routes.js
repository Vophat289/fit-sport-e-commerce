import express from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
} from '../controllers/order.controller.js';

const router = express.Router();

// Lấy tất cả đơn hàng
router.get('/', getAllOrders);

// Lấy chi tiết 1 đơn hàng (bao gồm items)
router.get('/:id', getOrderById);

// Cập nhật trạng thái đơn hàng
router.put('/:id/status', updateOrderStatus);

// Tạo đơn hàng mới
router.post('/', createOrder);

// Xóa đơn hàng
router.delete('/:id', deleteOrder);

export default router;