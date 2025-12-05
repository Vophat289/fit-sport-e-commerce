import moment from "moment";
import { buildPayment, verifyIpn } from "../services/vnpay.service";


export function createPayment(req, res){
    const orderId = moment().format("YYYYMMDDHHmmss"); //tạo mã đơn hàng unique theo timestamp
    const paymentUrl = buildPayment(req.body.amount, orderId); //gọi service buildpayment

    return res.json({paymentUrl}); // trả url về cho fe
}


//VNPAY gửi callback đến /api/vnpay/ipn
export function ipn(req, res){
    const result = verifyIpn(req.query); //gửi req.query vào verifyIpn() 

    if(result.isVerified && result.vnp_ResponseCode == "00"){
        return res.json({ RspCode: "00", Message: "Success"});
    }

    return res.json({ RspCode: "01", Message: "Failed"})
}