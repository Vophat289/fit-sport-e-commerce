import express from "express";
import { getDashboardData } from "../../controllers/admin/dashboard.admin.controller.js";

const router = express.Router();

router.get("/", getDashboardData);

export default router;