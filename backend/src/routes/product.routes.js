import express from 'express';
import {getAllProducts, getProductBySlug, getProductsByCategory, createProduct, updateProduct, deleteProduct, incrementViewCount, searchProducts, getRelatedProducts, getBestSellingProducts} from "../controllers/product.controller.js";
import upload from '../middlewares/upload.middleware.js';
import { getAvailableVariants, getVariantDetails } from "../controllers/admin/variant.admin.controller.js";
const router = express.Router();

router.get("/search", searchProducts);
router.get("/", getAllProducts);
router.get("/best-selling", getBestSellingProducts);
router.get("/variants/:productId", getAvailableVariants);
router.get("/variant-details", getVariantDetails);
router.get("/related/:productId", getRelatedProducts);
router.get("/:slug", getProductBySlug);
router.get("/category/:slug", getProductsByCategory);
router.post("/:slug/view", incrementViewCount);

router.post("/",upload.array("images", 5), createProduct);
router.put("/:id",upload.array("images", 5), updateProduct);
router.delete("/:id", deleteProduct);

export default router;
