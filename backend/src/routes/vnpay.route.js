import { Router } from "express";
import { createPayment, ipn } from "../controllers/vnpay.controller"

const router = Router();

router.post("/create-payment", createPayment);
router.get("/ipn", ipn);

export default router;