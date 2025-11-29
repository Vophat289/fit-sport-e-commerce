import express from "express";
import {
  getAllVouchers,
  getVoucherByCode,
  createVoucher,
  updateVoucher,
  deleteVoucher
} from "../../controllers/admin/voucher.admin.controller.js";

const router = express.Router();

router.get("/", getAllVouchers);
router.get("/:code", getVoucherByCode);
router.post("/", createVoucher);
router.put("/:code", updateVoucher);
router.delete("/:code", deleteVoucher);

export default router;
