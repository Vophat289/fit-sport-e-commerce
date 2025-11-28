// src/models/odersDetails.model.js
import mongoose from 'mongoose';

const OdersDetailsSchema = new mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId, // Liên kết với _id của bảng Oders
        ref: 'Oders',
        required: true,
    },
    variant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductsVariant',
        required: true,
    },
    price: { // Giá tại thời điểm đặt hàng/thêm vào giỏ
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
}, { timestamps: true });

const OdersDetails = mongoose.model('OdersDetails', OdersDetailsSchema);
export default OdersDetails;