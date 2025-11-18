import express from "express";
import CartController from "../controllers/cart.controller.js";

const router = express.Router();

// lây giỏ hàng
router.get("/:user_id", CartController.getCart);

// thêm sp vào giỏ hàng
router.post("/add", CartController.addToCart);

// tăng/giảm
router.post("/increase", CartController.increaseQty);
router.post("/decrease", CartController.decreaseQty);

// xóa sản phẩm
router.post("/remove", CartController.removeItem);

// xóa toàn bộ giỏ hàng
router.delete("/clear/:user_id", CartController.clearCart);

// voucher
router.post("/apply-voucher", CartController.applyVoucher);
router.post("/remove-voucher", CartController.removeVoucher);

// tổng tiền tự động
router.get("/total/:user_id", CartController.getCartTotal);


export default router;
