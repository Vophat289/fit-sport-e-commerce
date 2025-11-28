// src/controllers/sizeColor.controller.js
import Size from '../models/size.model.js';
import Color from '../models/color.model.js';

// --- HÀM HỖ TRỢ CHUNG ---
const handleSaveError = (res, error, itemName) => {
    if (error.code === 11000) {
        return res.status(400).json({ message: `${itemName} này đã tồn tại.` });
    }
    console.error(`Lỗi khi xử lý ${itemName}:`, error.message);
    return res.status(500).json({ message: `Lỗi server khi xử lý ${itemName}.` });
};

// ===================================
// SIZE CONTROLLERS
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

// ===================================
// COLOR CONTROLLERS
// ===================================

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