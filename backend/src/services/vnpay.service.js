
import { VNPay } from "vnpay";
import config from "../config/vnpay.config.js"

//tạo instance để nạp TMN code, secret
const vnpay = new VNPay({
    tmnCode: config.tmnCode,
    secureSecret: config.secretKey,
    testMode: true 
})

//khi thanh toán gọi fe gọi lên buildPayment
export function buildPayment(amount, orderId, ipAddr = "127.0.0.1"){
    const paymentConfig = {
        vnp_Amount: amount * 100, //Số tiền * 100 (bắt buộc theo chuẩn VNPAY)
        vnp_IpAddr: ipAddr,
        vnp_TxnRef: orderId, // mã đơn hàng
        vnp_OrderInfo: `Order #${orderId}`,
        vnp_ReturnUrl: config.returnUrl, //trả về url để redirect URL FE để redirect sau thanh toán
    };
    
    // Thêm IPN URL nếu có (VNPay cần để gửi callback)
    if (config.ipnUrl) {
        paymentConfig.vnp_IpUrl = config.ipnUrl;
    }
    
    return vnpay.buildPaymentUrl(paymentConfig);
}

//khi backend gọi verifyIpncall thì thư viện tự xác nhận chữ kí
export function verifyIpn(query){
    return vnpay.verifyIpnCall(query);
}

