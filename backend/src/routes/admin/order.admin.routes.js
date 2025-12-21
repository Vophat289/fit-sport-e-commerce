// src/routes/admin/order.admin.routes.js
import express from "express";
import {
  getAllOrders,
  getOrderDetail,
  updateOrderStatus,
  getOrderStats
} from "../../controllers/admin/order.admin.controller.js";
import { authMiddleware, isAdmin } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * ============================
 * ADMIN ORDER ROUTES
 * ============================
 * Tất cả route bên dưới:
 *  - Bắt buộc đăng nhập
 *  - Bắt buộc role ADMIN
 */
router.use(authMiddleware);
router.use(isAdmin);

/**
 * GET /admin/orders
 * Danh sách đơn hàng (pagination, filter, search)
 */
router.get("/", getAllOrders);

/**
 * GET /admin/orders/stats
 * Thống kê đơn hàng
 * ⚠️ Phải đặt TRƯỚC /:id
 */
router.get("/stats", getOrderStats);

/**
 * GET /admin/orders/:id
 * Xem chi tiết đơn hàng
 */
router.get("/:id", getOrderDetail);

/**
 * PUT /admin/orders/:id/status
 * Cập nhật trạng thái đơn hàng
 * ❌ Admin KHÔNG được hủy đơn
 * ✅ Trạng thái phải đi đúng thứ tự
 */
router.put("/:id/status", updateOrderStatus);

export default router;