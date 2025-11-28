import express from "express";
import { getDashboardData } from "../../controllers/admin/dashboard.contronller.js";

const router = express.Router();

router.get("/", getDashboardData);

export default router;