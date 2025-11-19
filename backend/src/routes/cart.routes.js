import express from "express";
import * as CartController from "../controllers/cart.controller.js";

const router = express.Router();

// Lấy giỏ hàng
router.get("/:user_id", CartController.getCart);

// Thêm sản phẩm vào giỏ hàng
router.post("/add", CartController.addToCart);

// Tăng số lượng sản phẩm
router.post("/increase", CartController.increaseQty);

// Giảm số lượng sản phẩm
router.post("/decrease", CartController.decreaseQty);

// Xóa sản phẩm khỏi giỏ hàng
router.post("/remove", CartController.removeItem);

// Xóa toàn bộ giỏ hàng
router.delete("/clear/:user_id", CartController.clearCart);

// Áp dụng voucher
router.post("/apply-voucher", CartController.applyVoucher);

// Xóa voucher
router.post("/remove-voucher", CartController.removeVoucher);

export default router;
