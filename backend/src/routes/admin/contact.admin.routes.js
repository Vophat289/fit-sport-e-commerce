import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { getAllContacts, toggleContactVisibility } from "../../controllers/admin/contact.admin.controller.js";

const router = express.Router();

// GET danh sách contact với phân trang và search
router.get("/", authMiddleware, getAllContacts);

// PATCH ẩn/hiện contact
router.patch("/:id/toggle", authMiddleware, toggleContactVisibility);

export default router;
