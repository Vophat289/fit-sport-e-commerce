import express from 'express';
import * as voucherController from "../controllers/voucher.controller.js";

const router = express.Router();

router.get("/", voucherController.getAvailable);               // lấy danh sách voucher khả dụng
router.post("/validate", voucherController.validate);          // kiểm tra voucher
router.post("/use", voucherController.useVoucher);             // tăng used_count khi thanh toán

export default router;