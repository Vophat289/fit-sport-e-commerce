// src/models/oders.model.js
import mongoose from 'mongoose';

const OdersSchema = new mongoose.Schema({
    // Khóa Ngoại 1 (FK1)
    user_id: {
        type: String, // Dùng String để hỗ trợ cả ObjectId và ID OAuth
        ref: 'User',
        required: true,
    },
    
    order_code: {
        type: String,
        unique: true,
        required: true,
    },
    
    // Thông tin người nhận hàng
    receiver_name: { type: String, required: false },
    receiver_mobile: { type: String, required: false },
    receiver_address: { type: String, required: false }, // Chi tiết địa chỉ giao hàng
    
    // Giá và Phí
    total_price: { // Tổng giá trị sản phẩm (chưa bao gồm phí giao hàng)
        type: Number,
        required: true,
        default: 0,
    },
    delivery_fee: {
        type: Number,
        required: true,
        default: 0,
    },
    
    // Trạng thái Đơn hàng/Giỏ hàng
    status: {
        type: String,
        enum: ['CART', 'PENDING', 'CONFIRMED','SHIPPING','SHIPPED', 'DELIVERED', 'CANCELLED'],
        default: 'CART', // Giỏ hàng sẽ có trạng thái là 'CART'
    },
    
    // Trạng thái Thanh toán
    payment_status: {
        type: String,
        enum: ['INIT', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'COD'],
        default: 'INIT',
    },

    // Khóa Ngoại 2 (FK2) - Tùy chọn (Chỉ cần nếu bạn có PaymentGateway Model)
    payment_gateway_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentGateway', 
        required: false,
    },

    // Khóa Ngoại 3 (FK3) - Tùy chọn (Chỉ cần nếu bạn có Voucher Model)
    voucher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Voucher',
        required: false,
    },

    vnpay_transaction_id: {
        type: String, // vnp_TxnRef từ VNPay
        required: false,
        index: true
    }

}, { timestamps: true });

const Oders = mongoose.model('Oders', OdersSchema);
export default Oders;