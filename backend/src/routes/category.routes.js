import express from 'express';
import {getAllCategories, createCategory, updateCategory, deleteCategory, getCategoryBySlug} from '../controllers/category.controller.js';

const router = express.Router();

router.get("/", getAllCategories);
router.get("/:slug", getCategoryBySlug); 
router.post("/", createCategory);
router.post("/:slug", updateCategory);
router.delete("/:slug", deleteCategory);

export default router;