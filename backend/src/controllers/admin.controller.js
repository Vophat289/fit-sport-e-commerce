// src/controllers/admin.controller.js
import Size from '../models/size.model.js'; 
import Color from '../models/color.model.js';
import Product from '../models/product.model.js'; 
import ProductsVariant from '../models/productsVariant.model.js'; 
import mongoose from 'mongoose'; 

// --- HÀM HỖ TRỢ XỬ LÝ LỖI ---
const handleSaveError = (res, error, itemName) => {
    if (error.code === 11000) {
        return res.status(400).json({ message: `${itemName} này đã tồn tại.` });
    }
    console.error(`Lỗi khi xử lý ${itemName}:`, error.message);
    return res.status(500).json({ message: `Lỗi server khi xử lý ${itemName}.` });
};

// ===================================
// 1. SIZE & COLOR CONTROLLERS
// ... (Các hàm addSize, getAllSizes, addColor, getAllColors giữ nguyên)
// ===================================

export const addSize = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên kích cỡ không được để trống.' });

        const newSize = new Size({ name: name.toUpperCase().trim() });
        await newSize.save();
        
        return res.status(201).json({ message: 'Thêm kích cỡ thành công.', size: newSize });
    } catch (error) {
        return handleSaveError(res, error, 'kích cỡ');
    }
};

export const getAllSizes = async (req, res) => {
    try {
        const sizes = await Size.find().sort({ name: 1 });
        return res.status(200).json(sizes);
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi khi tải danh sách kích cỡ.' });
    }
};

export const addColor = async (req, res) => {
    try {
        const { name, hex_code } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên màu không được để trống.' });

        const newColor = new Color({ name: name.trim(), hex_code });
        await newColor.save();
        
        return res.status(201).json({ message: 'Thêm màu sắc thành công.', color: newColor });
    } catch (error) {
        return handleSaveError(res, error, 'màu sắc');
    }
};

export const getAllColors = async (req, res) => {
    try {
        const colors = await Color.find().sort({ name: 1 });
        return res.status(200).json(colors);
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi khi tải danh sách màu sắc.' });
    }
};

// ===================================
// 3. PRODUCT BASIC (Cho Seeder)
// ... (getProductsBasic giữ nguyên)
// ===================================

export const getProductsBasic = async (req, res) => {
    try {
        const products = await Product.find().select('_id name');
        return res.status(200).json(products);
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm cơ bản:', error);
        res.status(500).json({ message: 'Lỗi server khi tải danh sách sản phẩm cơ bản.' });
    }
};


// ===================================
// 4. VARIANT CONTROLLERS
// ===================================

export const addProductVariant = async (req, res) => {
    try {
        const { product_id, size_id, color_id, price, quantity } = req.body;

        if (!product_id || !size_id || !color_id || price === undefined || quantity === undefined) {
            return res.status(400).json({ message: 'Thiếu trường bắt buộc (product, size, color, price, quantity).' });
        }
        
        // 1. Kiểm tra xem biến thể đã tồn tại chưa
        const existingVariant = await ProductsVariant.findOne({ product_id, size_id, color_id });
        if (existingVariant) {
            return res.status(400).json({ message: 'Biến thể này đã tồn tại cho sản phẩm này.' });
        }

        // 2. Tạo biến thể mới
        const newVariant = new ProductsVariant({
            product_id,
            size_id,
            color_id,
            price: price,
            quantity: quantity
        });
        await newVariant.save();

        res.status(201).json({ message: 'Thêm biến thể thành công.', variant: newVariant });
    } catch (error) {
        console.error('Lỗi khi thêm biến thể:', error.message);
        res.status(500).json({ message: 'Lỗi server khi thêm biến thể.' });
    }
};

/**
 * Endpoint: GET /api/admin/variants/:productId - Lấy biến thể khả dụng
 */
export const getAvailableVariants = async (req, res) => {
    try {
        const { productId } = req.params;

        // 1. Tìm tất cả biến thể cho sản phẩm này có tồn kho > 0
        const availableVariants = await ProductsVariant.find({ 
            product_id: productId, 
            quantity: { $gt: 0 } // quantity > 0
        })
        .select('size_id color_id')
        .populate([
            { path: 'size_id', model: 'Size', select: 'name' }, 
            { path: 'color_id', model: 'Color', select: 'name hex_code' }
        ]);

        // ✅ BỔ SUNG LOGGING ĐỂ KIỂM TRA
        console.log('--- DEBUG VARIANT DATA ---');
        console.log(`DEBUG: Variants found for product ${productId}: ${availableVariants.length}`);
        
        if (availableVariants.length > 0) {
            // Log chi tiết biến thể đầu tiên để kiểm tra populate
            const firstVariant = availableVariants[0];
            console.log('DEBUG: Size ID:', firstVariant.size_id?._id, 'Name:', firstVariant.size_id?.name);
            console.log('DEBUG: Color ID:', firstVariant.color_id?._id, 'Name:', firstVariant.color_id?.name);
            if (!firstVariant.size_id || !firstVariant.color_id) {
                 console.error('Size hoặc Color không được tìm thấy. Kiểm tra lại FK.');
            }
        }
        console.log('---------------------------');
        // ------------------------------------


        // 2. Tổng hợp danh sách duy nhất các Size và Color (dành cho Modal)
        const sizes = new Map();
        const colors = new Map();

        availableVariants.forEach(v => {
            // Chỉ thêm nếu populate thành công (v.size_id tồn tại)
            if (v.size_id && v.size_id.name) { 
                sizes.set(v.size_id._id.toString(), { id: v.size_id._id, name: v.size_id.name });
            }
            if (v.color_id && v.color_id.name) {
                colors.set(v.color_id._id.toString(), { id: v.color_id._id, name: v.color_id.name, hex: v.color_id.hex_code });
            }
        });

        // 3. Trả về cho Frontend (trả về empty array nếu không có variants)
        return res.json({
            availableSizes: Array.from(sizes.values()),
            availableColors: Array.from(colors.values()),
            hasVariants: availableVariants.length > 0,
            message: availableVariants.length === 0 ? 'Sản phẩm này hiện chưa có biến thể hoặc đã hết hàng.' : null
        });

    } catch (error) {
        console.error('Lỗi khi lấy biến thể khả dụng:', error);
        return res.status(500).json({ message: 'Lỗi server khi tải biến thể.' });
    }
};

/**
 * Endpoint: GET /api/admin/variant-details?product=...&size=...&color=...
 * Lấy chi tiết biến thể (Giá/Tồn kho)
 */
export const getVariantDetails = async (req, res) => {
    try {
        // Lấy 3 ID từ query parameters
        const { product: productId, size: sizeId, color: colorId } = req.query;

        if (!productId || !sizeId || !colorId) {
            return res.status(400).json({ message: 'Thiếu thông tin biến thể cần tìm kiếm.' });
        }

        // 1. Tìm kiếm biến thể chính xác
        const variant = await ProductsVariant.findOne({
            product_id: productId,
            size_id: sizeId,
            color_id: colorId,
        });

        if (!variant) {
            // Nếu không tìm thấy tổ hợp này, coi như hết hàng (hoặc không tồn tại)
            return res.status(404).json({ message: 'Tổ hợp kích cỡ/màu sắc này không tồn tại hoặc hết hàng.' });
        }

        // 2. Trả về chi tiết cần thiết cho Frontend
        return res.json({
            price: variant.price,
            quantity: variant.quantity,
            variantId: variant._id, // ID của biến thể
        });

    } catch (error) {
        console.error('Lỗi khi tải chi tiết biến thể:', error.message);
        return res.status(500).json({ message: 'Lỗi server khi tải chi tiết biến thể.' });
    }
};