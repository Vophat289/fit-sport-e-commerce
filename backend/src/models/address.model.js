import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
    user: {
        type: String, 
        ref: 'User',
        required: true,
    },

    receiverName: {
        type: String,
        required: true,
        trim: true,
    },

    phone: {
        type: String,
        required: true,
        trim: true,
    },

    // 1. Địa chỉ chi tiết 
    street: {
        type: String,
        required: true,
        trim: true,
    },
    
    // 2. Phường/Xã
    ward: {
        type: String,
        required: true,
        trim: true,
    },

    // 3. Quận/Huyện
    district: {
        type: String,
        required: true,
        trim: true,
    },

    // 4. Tỉnh/Thành phố
    province: {
        type: String,
        required: true,
        trim: true,
    },

    // Đặt làm địa chỉ mặc định
    isDefault: {
        type: Boolean,
        default: false,
    },

}, { 
    timestamps: true 
});

// MIDDLEWARE: Đảm bảo chỉ có một địa chỉ mặc định
AddressSchema.pre('save', async function (next) {
    if (this.isModified('isDefault') && this.isDefault) {
        await this.model('Address').updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { $set: { isDefault: false } }
        );
    }
    next();
});


const Address = mongoose.model('Address', AddressSchema);
export default Address;