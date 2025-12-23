
import { VNPay } from "vnpay";
import config from "../config/vnpay.config.js"

// Validate config before creating instance
if (!config.tmnCode || !config.secretKey) {
    console.error('Thiếu cấu hình VNPay: TMN_CODE hoặc SECRET_KEY');
    throw new Error('VNPay configuration is incomplete. Please check VNP_TMNCODE and VNP_HASHSECRET in .env');
}

//tạo instance để nạp TMN code, secret
const vnpay = new VNPay({
    tmnCode: config.tmnCode,
    secureSecret: config.secretKey,
    testMode: true 
})

console.log('Đã tạo VNPay instance với TMN Code:', config.tmnCode ? '***' + config.tmnCode.slice(-3) : 'THIẾU');

//khi thanh toán gọi fe gọi lên buildPayment
export function buildPayment(amount, orderId, ipAddr = "127.0.0.1"){
    // Validate inputs
    if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
    }
    if (!orderId) {
        throw new Error('Order ID is required');
    }
    if (!config.returnUrl) {
        throw new Error('VNP_RETURNURL is not configured in .env');
    }
    
    console.log('=== VNPay buildPayment Debug ===');
    console.log('- Amount nhận vào (VND):', amount);
    console.log('- Lưu ý: Thư viện VNPay sẽ tự động nhân 100, không cần nhân ở đây');
    
    const paymentConfig = {
        vnp_Amount: amount, // Thư viện VNPay sẽ tự động nhân 100 trong buildPaymentUrl
        vnp_IpAddr: ipAddr,
        vnp_TxnRef: orderId, // mã đơn hàng
        vnp_OrderInfo: `Order #${orderId}`,
        vnp_ReturnUrl: config.returnUrl, //trả về url để redirect URL FE để redirect sau thanh toán
    };
    
    // Thêm IPN URL nếu có (VNPay cần để gửi callback)
 
    
    console.log('- Mã đơn hàng:', orderId);
    console.log('- Địa chỉ IP:', ipAddr);
    console.log('- Return URL:', config.returnUrl);
    console.log('- TMN Code:', config.tmnCode ? '***' + config.tmnCode.slice(-3) : 'THIẾU');
    console.log('- vnp_Amount trong config (VND):', paymentConfig.vnp_Amount);
    console.log('- vnp_Amount sau khi thư viện nhân 100:', paymentConfig.vnp_Amount * 100);
    
    try {
        const paymentUrl = vnpay.buildPaymentUrl(paymentConfig);
        console.log('Đã tạo Payment URL thành công');
        return paymentUrl;
    } catch (error) {
        console.error('Lỗi khi tạo payment URL:', error);
        throw error;
    }
}

//khi backend gọi verifyIpncall thì thư viện tự xác nhận chữ kí
export function verifyIpn(query){
    return vnpay.verifyIpnCall(query);
}

