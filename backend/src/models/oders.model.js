import mongoose from 'mongoose';

const OdersSchema = new mongoose.Schema({
    // Khóa Ngoại 1 (FK1)
    user_id: {
        type: String, // Dùng String để hỗ trợ cả ObjectId và ID OAuth
        ref: 'User',
        required: false, // Thay đổi thành false nếu chấp nhận khách lẻ không đăng nhập
    },
    
    order_code: {
        type: String,
        unique: true,
        required: true,
    },
    
    // Thông tin người nhận hàng
    receiver_name: { type: String, required: false },
    receiver_phone: { type: String, required: false }, // Đổi từ mobile sang phone
    receiver_address: { type: String, required: false }, 
    
    // Giá và Phí
    total_price: { 
        type: Number,
        required: true,
        default: 0,
    },
    delivery_fee: {
        type: Number,
        required: true,
        default: 0,
    },
    voucher_discount: {
        type: Number,
        required: false,
        default: 0,
    },
    
    // TRẠNG THÁI ĐÃ ĐƯỢC CẬP NHẬT
    status: {
        type: String,
        enum: ['CART', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'],
        default: 'CART', 
    },
    
    // Phương thức thanh toán
    payment_method: {
        type: String,
        enum: ['COD', 'VNPAY'],
        default: 'VNPAY',
    },

    // Trạng thái Thanh toán
    payment_status: {
        type: String,
        enum: ['INIT', 'PENDING', 'SUCCESS', 'FAILED'],
        default: 'INIT',
    },

    // Khóa Ngoại 2 (FK2) 
    payment_gateway_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentGateway', 
        required: false,
    },

    // Khóa Ngoại 3 (FK3) 
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