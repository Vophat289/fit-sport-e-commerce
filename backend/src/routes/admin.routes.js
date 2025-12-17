// src/routes/admin.routes.js
import express from 'express';
import { 
    addSize, getAllSizes, addColor, getAllColors, 
    addProductVariant,
    getProductsBasic,
    // ✅ BỔ SUNG: Import hàm lấy biến thể khả dụng
    getAvailableVariants,
    getVariantDetails 
} from '../controllers/admin.controller.js'; // Giả định hàm này nằm trong admin.controller.js
import { authMiddleware } from '../middlewares/auth.middleware.js'; // Bảo vệ route

const router = express.Router();

// --- SIZE ROUTES ---
router.route('/sizes')
    .post(authMiddleware, addSize)      
    .get(authMiddleware, getAllSizes);  

// --- COLOR ROUTES ---
router.route('/colors')
    .post(authMiddleware, addColor)     
    .get(authMiddleware, getAllColors); 

// --- PRODUCT BASIC (Cho Admin Seeder) ---
router.get('/products-basic', authMiddleware, getProductsBasic);


// --- VARIANT ROUTE ---
// 1. POST để tạo Variant
router.post('/variants', authMiddleware, addProductVariant); 

// 2. ✅ BỔ SUNG: GET Biến thể khả dụng (GET /api/admin/variants/:productId)
// Hàm này phục vụ Modal trên Frontend
router.get('/variants/:productId', authMiddleware, getAvailableVariants);
router.get('/variant-details', authMiddleware, getVariantDetails);

export default router;
// 💡 Đừng quên kết nối router này trong server.js: app.use('/api/admin', adminRoutes);