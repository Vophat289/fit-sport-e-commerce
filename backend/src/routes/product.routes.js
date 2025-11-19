import express from 'express';
import {getAllProducts,getProductBySlug,getProductsByCategory, createProduct, updateProduct, deleteProduct} from "../controllers/product.controller.js";
import upload from '../middlewares/upload.middleware.js';
const router = express.Router();


router.get("/", getAllProducts);
router.get("/:slug", getProductBySlug);
router.get("/category/:slug", getProductsByCategory)

router.post("/",upload.array("images", 5), createProduct);
router.post("/:id",upload.array("images", 5), updateProduct);
router.delete("/:id", deleteProduct);

export default router;
