import express from "express";
import { getDashboardData } from "../../controllers/admin/dashboard.contronller.js";
import { getTopProducts } from "../../controllers/admin/dashboard.contronller.js";
import { getTopUsers } from "../../controllers/admin/dashboard.contronller.js";

const router = express.Router();

router.get("/top-products", getTopProducts);
router.get("/top-users", getTopUsers);
router.get("/", getDashboardData);

export default router;