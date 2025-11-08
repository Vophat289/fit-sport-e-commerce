import express from 'express';
import {getAllProducts, createProduct, updateProduct, deleteProduct} from "../controllers/product.controller.js";
import upload from '../middlewares/upload.middleware.js';
const router = express.Router();


router.get("/", getAllProducts);
router.post("/",upload.array("images", 5), createProduct);
router.post("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;