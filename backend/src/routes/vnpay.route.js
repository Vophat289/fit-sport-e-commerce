import { Router } from "express";
import { createPayment, ipn, returnUrl } from "../controllers/vnpay.controller.js"

const router = Router();

router.post("/create-payment", createPayment);
router.get("/ipn", ipn);
router.get("/return", returnUrl);
export default router;                                                                                                                                                                                                                                                                                                                                                                  