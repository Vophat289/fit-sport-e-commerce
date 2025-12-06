
import { VNPay } from "vnpay";
import config from "../config/vnpay.config.js"

// Validate config before creating instance
if (!config.tmnCode || !config.secretKey) {
    console.error('❌ VNPay config missing: TMN_CODE or SECRET_KEY');
    throw new Error('VNPay configuration is incomplete. Please check VNP_TMNCODE and VNP_HASHSECRET in .env');
}

//tạo instance để nạp TMN code, secret
const vnpay = new VNPay({
    tmnCode: config.tmnCode,
    secureSecret: config.secretKey,
    testMode: true 
})

console.log('✅ VNPay instance created with TMN Code:', config.tmnCode ? '***' + config.tmnCode.slice(-3) : 'MISSING');

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
    
    const paymentConfig = {
        vnp_Amount: amount * 100, //Số tiền * 100 (bắt buộc theo chuẩn VNPAY)
        vnp_IpAddr: ipAddr,
        vnp_TxnRef: orderId, // mã đơn hàng
        vnp_OrderInfo: `Order #${orderId}`,
        vnp_ReturnUrl: config.returnUrl, //trả về url để redirect URL FE để redirect sau thanh toán
    };
    
    // Thêm IPN URL nếu có (VNPay cần để gửi callback)
    // Lưu ý: VNPay npm package có thể không cần parameter này trong buildPaymentUrl
    // Chỉ cần cấu hình trong merchant portal của VNPay
    // if (config.ipnUrl) {
    //     paymentConfig.vnp_IpnUrl = config.ipnUrl; // Không dùng vnp_IpUrl
    // }
    
    console.log('🔧 Building VNPay payment URL with config:');
    console.log('- Amount:', amount, '->', amount * 100);
    console.log('- Order ID:', orderId);
    console.log('- IP Address:', ipAddr);
    console.log('- Return URL:', config.returnUrl);
    console.log('- TMN Code:', config.tmnCode ? '***' + config.tmnCode.slice(-3) : 'MISSING');
    
    try {
        const paymentUrl = vnpay.buildPaymentUrl(paymentConfig);
        console.log('✅ Payment URL created successfully');
        return paymentUrl;
    } catch (error) {
        console.error('❌ Error building payment URL:', error);
        throw error;
    }
}

//khi backend gọi verifyIpncall thì thư viện tự xác nhận chữ kí
export function verifyIpn(query){
    return vnpay.verifyIpnCall(query);
}

