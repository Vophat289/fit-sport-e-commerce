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

// Tất cả routes đều yêu cầu authentication và admin role
router.use(authMiddleware);
router.use(isAdmin);

// GET danh sách đơn hàng (có phân trang, filter, search)
router.get("/", getAllOrders);

// GET thống kê đơn hàng
router.get("/stats", getOrderStats);

// GET chi tiết đơn hàng
router.get("/:id", getOrderDetail);

// PUT cập nhật trạng thái đơn hàng
router.put("/:id/status", updateOrderStatus);

export default router;

