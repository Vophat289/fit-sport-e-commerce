import express from 'express';
import {getAllProducts, createProduct, updateProduct, deleteProduct} from "../controllers/product.controller.js";

const router = express.Router();


router.get("/", getAllProducts);
router.post("/", createProduct);
router.post("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;