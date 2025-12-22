import express from 'express';
import * as voucherController from "../controllers/voucher.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", voucherController.getAvailable);
router.post("/validate", voucherController.validate); 
router.post("/use", voucherController.useVoucher);
router.post("/apply", voucherController.applyVoucher);
router.post("/collect", authMiddleware, voucherController.collectVoucher);

export default router;

