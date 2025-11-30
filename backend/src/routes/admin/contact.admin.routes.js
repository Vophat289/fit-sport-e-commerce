import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { getAllContacts, deleteContact } from "../../controllers/admin/contact.admin.controller.js";

const router = express.Router();

// GET danh sách contact
router.get("/", authMiddleware, getAllContacts);

// DELETE xóa liên hệ
router.delete("/:id", authMiddleware, deleteContact);

export default router;
