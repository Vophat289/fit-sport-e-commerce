// src/routes/order.routes.js
import express from "express";
import {
  getOrdersByUser,
  getOrderDetail,
  cancelOrder,
} from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/account/my-orders", authMiddleware, getOrdersByUser);
router.get("/account/:id", authMiddleware, getOrderDetail);
router.put("/account/:id/cancel", authMiddleware, cancelOrder);

export default router;