import express from 'express';
import productController from "../controllers/product.controller.js";

const router = express.Router();

router.get("/", productController.getAllProducts);
router.post("/", productController.createProduct);
router.post("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

export default router;