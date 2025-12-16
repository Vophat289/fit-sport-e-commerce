// src/routes/admin/variant.admin.routes.js
import express from "express";
const router = express.Router();

import * as adminProductController from "../../controllers/admin/variant.admin.controller.js";


router.get("/sizes", adminProductController.getSizes);
router.get("/colors", adminProductController.getColors);
router.post("/sizes", adminProductController.addSize);
router.post("/colors", adminProductController.addColor);


router.get(
  "/variants/product/:productId",
  adminProductController.getVariantsByProduct
);

router.post("/variants", adminProductController.addVariant);
router.put("/variants/:id", adminProductController.updateVariant);
router.delete("/variants/:id", adminProductController.deleteVariant);
router.get("/product-detail/:id", adminProductController.getProductDetails);

export default router;
