import User from "../models/user.model.js";
import Address from "../models/address.model.js";
import mongoose from 'mongoose'; 

/**
 * Tạo truy vấn tìm kiếm linh hoạt cho cả ObjectId và ID chuỗi OAuth (googleId).
 * @param {string} userId
 * @returns {object}
 */
const getUserQuery = (userId) => {
    if (mongoose.Types.ObjectId.isValid(userId)) {
    // 1. User truyền thống (tìm theo _id)
        return { _id: userId };
    } 
    // 2. ID OAuth (Chuỗi số dài)
    return { $or: [
        { googleId: userId }, 
        { _id: userId } 
    ]};
};
const findUserByIdOrOauth = async (userId) => {
    const query = getUserQuery(userId);
    return User.findOne(query).select('-password');
};

// 1. PROFILE (LẤY VÀ CẬP NHẬT)
export const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: Missing user payload.' });
        }

        const userId = req.user._id || req.user.id; 

        if (!userId) {
             return res.status(401).json({ message: 'Invalid token payload: User ID missing.' });
        }   

        // 1. Tìm thông tin User 
        const user = await findUserByIdOrOauth(userId);

        if (!user) {
            console.warn(`DEBUG-RESULT: User not found for ID: ${userId}`);
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ người dùng.' });
        }

        // 2. Tìm Địa chỉ mặc định (nếu có)
        let defaultAddress = null;
        try {
            defaultAddress = await Address.findOne({ user: userId, isDefault: true });
        } catch (err) {
            console.warn('Không tìm thấy defaultAddress, sẽ bỏ qua.', err.message);
        }

        // 3. Tạo profile trả về
        const profile = {
            name: user.name || '', // nếu user.name rỗng thì trả về chuỗi rỗng thay vì "Unknown"
            email: user.email || '',
            phone: user.phone || defaultAddress?.phone || '', 
            gender: user.gender || '',
            dob: user.dob ? user.dob.toISOString().split('T')[0] : '', 
            avatarUrl: user.avatarUrl || '',
            role: user.role || 'user',
        };

        res.json(profile); 
    } catch (error) {
        console.error('LỖI TRONG GET PROFILE (Controller):', error.message, error.stack); 
        res.status(500).json({ 
            message: 'Lỗi khi lấy thông tin hồ sơ', 
            error: error.message 
        });
    }
};


export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const updateFields = req.body;
        const query = getUserQuery(userId);
        const updatedUser = await User.findOneAndUpdate(
            query, 
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        // 3. TRẢ VỀ PROFILE ĐÃ CẬP NHẬT
        const profile = {
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone || '',
            gender: updatedUser.gender,
            dob: updatedUser.dob ? updatedUser.dob.toISOString().split('T')[0] : '',
            avatarUrl: updatedUser.avatarUrl,
        };

        res.status(200).json(profile);

    } catch (error) {
        console.error('LỖI GỐC TRONG UPDATE PROFILE (Controller):', error.message, error.stack);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ 
            message: 'Lỗi khi cập nhật hồ sơ', 
            error: error.message 
        });
    }
};

// 2. ADDRESSES (THÊM, SỬA, XÓA)
export const getAddresses = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        // Truy vấn này hoạt động vì Address.user đã được sửa thành String (hoặc tự động cast).
        const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: 1 });
        res.json(addresses);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách địa chỉ:', error.message, error.stack); 
        res.status(500).json({ message: 'Lỗi khi lấy danh sách địa chỉ', error: error.message });
    }
};

export const createAddress = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const addressData = { ...req.body, user: userId }; 

        if (addressData.isDefault === true) {
            await Address.updateMany({ user: userId, isDefault: true }, { isDefault: false });
        }
        
        const newAddress = new Address(addressData);
        const savedAddress = await newAddress.save(); 
        res.status(201).json(savedAddress);
    } catch (error) {
        console.error('Lỗi khi thêm địa chỉ:', error.message, error.stack);
        res.status(500).json({ message: 'Lỗi khi thêm địa chỉ', error: error.message });
    }
};

export const updateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id || req.user.id;

        if (req.body.isDefault === true) {
            await Address.updateMany(
                { user: userId, isDefault: true, _id: { $ne: id } }, 
                { isDefault: false }
            );
        }

        const updatedAddress = await Address.findOneAndUpdate(
            { _id: id, user: userId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedAddress) {
            return res.status(404).json({ message: 'Không tìm thấy địa chỉ hoặc bạn không có quyền sửa.' });
        }
        res.status(200).json(updatedAddress);
    } catch (error) {
        console.error('Lỗi khi cập nhật địa chỉ:', error.message, error.stack);
        res.status(500).json({ message: 'Lỗi khi cập nhật địa chỉ', error: error.message });
    }
};

export const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id || req.user.id;
        
        const addressToDelete = await Address.findOne({ _id: id, user: userId });
        if (addressToDelete && addressToDelete.isDefault) {
             return res.status(400).json({ message: 'Không thể xóa địa chỉ mặc định. Vui lòng đặt địa chỉ khác làm mặc định trước khi xóa.' });
        }

        const deletedAddress = await Address.findOneAndDelete({ _id: id, user: userId });
        if (!deletedAddress) {
            return res.status(404).json({ message: 'Không tìm thấy địa chỉ để xóa.' });
        }
        
        res.status(200).json({ message: 'Đã xóa địa chỉ thành công.' });
    } catch (error) {
        console.error('Lỗi khi xóa địa chỉ:', error.message, error.stack);
        res.status(500).json({ message: 'Lỗi khi xóa địa chỉ', error: error.message });
    }
};