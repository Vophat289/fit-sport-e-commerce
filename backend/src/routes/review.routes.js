import express from "express";
import { addReview, getUserReviews, getProductReviews } from "../controllers/review.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Tạo đánh giá
router.post("/", authMiddleware, addReview);
router.get("/user", authMiddleware, getUserReviews);
router.get("/product/:productId", getProductReviews);

// Sau này có thể thêm: lấy đánh giá theo sản phẩm, xóa, duyệt, ...
export default router;
