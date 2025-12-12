import express from 'express';
import * as voucherController from "../controllers/voucher.controller.js";

const router = express.Router();

<<<<<<< HEAD
router.get("/", voucherController.getAvailable);
router.post("/validate", voucherController.validate); 
router.post("/use", voucherController.useVoucher);
router.post("/apply", voucherController.applyVoucher);
export default router;
=======
router.get("/", voucherController.getAvailable);               
router.post("/validate", voucherController.validate);
router.post("/use", voucherController.useVoucher);

export default router;
>>>>>>> origin/feature/review_product
