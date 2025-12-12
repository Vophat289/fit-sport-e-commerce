import express from 'express';
import * as voucherController from "../controllers/voucher.controller.js";

const router = express.Router();

router.get("/", voucherController.getAvailable);               
router.post("/validate", voucherController.validate);
router.post("/use", voucherController.useVoucher);

export default router;
