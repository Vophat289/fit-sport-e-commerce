
import { Vnpay } from "vnpay";
import config from "../config/vnpay.config"

//tạo instance để nạp TMN code, secret
const vnpay = new Vnpay({
    tmnCode: config.tmnCode,
    secureSecret: config.secretKey,
    testMode: true 
})

//khi thanh toán gọi fe gọi lên buildPayment
export function buildPayment(amount, orderId){
    return vnpay.buildPaymentUrl({
        vnp_Amount: amount * 100, //Số tiền * 100 (bắt buộc theo chuẩn VNPAY)
        vnp_IpAddr: "127.0.0.1",
        vnp_TxnRef: orderId, // mã đơn hàng
        vnp_OrderInfo: `Order #${orderId}`,
        vnp_ReturnUrl: config.returnUrl, //trả về url để redirect URL FE để redirect sau thanh toán
    })
}

//khi backend gọi verifyIpncall thì thư viện tự xác nhận chữ kí
export function verifyIpn(query){
    return vnpay.verifyIpnCall(query);
}

