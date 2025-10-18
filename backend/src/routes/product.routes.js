import express from 'express';
import productController from "../controllers/product.controller.js";

const router = express.Router();
const {getAllProducts, createProduct, updateProduct, deleteProduct} = productController

router.get("/", getAllProducts);
router.post("/", createProduct);
router.post("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;