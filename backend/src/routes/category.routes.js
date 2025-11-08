import express from 'express';
import {getAllCategories, createCategory, updateCategory , deleteCategory, getCategoryBySlug} from '../controllers/category.controller.js';
import upload from '../middlewares/upload.middleware.js';
const router = express.Router();

router.get("/", getAllCategories);
router.get("/:slug", getCategoryBySlug); 
router.post("/",upload.single('image') , createCategory);
router.post("/:id",upload.single('image'), updateCategory);
router.delete("/:id", deleteCategory);

export default router;