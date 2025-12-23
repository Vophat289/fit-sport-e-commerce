import express from 'express';
import { getAllReviews } from '../../controllers/admin/review.admin.controller.js';
import { authMiddleware, isAdmin } from '../../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * ============================
 * ADMIN REVIEW ROUTES
 * ============================
 * Tất cả route bên dưới:
 *  - Bắt buộc đăng nhập
 *  - Bắt buộc role ADMIN
 */
router.use(authMiddleware);
router.use(isAdmin);

/**
 * GET /admin/reviews
 * Danh sách đánh giá (có filter theo rating, productId, orderId, status)
 */
router.get('/', getAllReviews);

export default router;
