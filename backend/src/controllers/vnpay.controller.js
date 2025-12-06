import moment from "moment";
import { buildPayment, verifyIpn } from "../services/vnpay.service.js";
import Oders from "../models/oders.model.js";

export function createPayment(req, res){
    const orderId = moment().format("YYYYMMDDHHmmss"); //tạo mã đơn hàng unique theo timestamp
    const paymentUrl = buildPayment(req.body.amount, orderId); //gọi service buildpayment

    return res.json({paymentUrl}); // trả url về cho fe
}


//VNPAY gửi callback đến /api/vnpay/ipn
export async function ipn(req, res){
   try{
    const result = verifyIpn(req.query); //gửi req.query vào verifyIpn() 

    if(!result.isVerified){
        return res.json({ RspCode: "97", Message: "Checksum failed"});
    }

    //lấy ttin từ vnpay
    const vnp_TxnRef = req.query.vnp_TxnRef; 
    const vnp_ResponseCode = req.query.vnp_ResponseCode;
    const vnp_TransactionStatus = req.query.vnp_TransactionStatus;
    
    //tìm order theo transaction id
    const order = await Oders.findOne({
        vnpay_transaction_id: vnp_TxnRef
    });

    
    if(!order){
        console.error(`Không tìm thấy giao dịch: ${vnp_TxnRef}`);
        return res.json({ RspCode: "01", Message: "Không tìm thấy đơn hàng"})
    }

    //chỉ xử lí nếu order chưa đc cập nhật
    if(order.payment_status === 'PAID'){
        return res.json({ RspCode: "00", Message: "Đã được xử lý"})
    }
    
    if(vnp_ResponseCode === "00" && vnp_TransactionStatus === "00"){
        //update trạng thái đơn hàng
        order.payment_status = 'PAID';
        order.status = 'PENDING'; //giữ PENDING, admin sẽ xử lí đơn hàng
        await order.save();

        return res.json({ RspCode: "00", Message: "Thanh toán thành công"})
    }else{
        order.payment_status = 'PENDING';
        //giữ status pending để khách ngta có thể thử lại
        await order.save();

        return res.json({ RspCode: "07", Message: "Giao dịch không thành công"})
    }
   }catch(error){
        console.error('IPN Error:', error);
        return res.json({ RspCode: "99", Message: "Lỗi server khi xử lý IPN" });
   }
}

//user redirect về sau khi thanh toán
export async function returnUrl(req, res){
    try{
        console.log('=== VNPay Return URL Called ===');
        console.log('Query params:', JSON.stringify(req.query, null, 2));
        
        const vnp_TxnRef = req.query.vnp_TxnRef;
        const vnp_ResponseCode = req.query.vnp_ResponseCode;

        //verify lại
        const result = verifyIpn(req.query);
        console.log('Verify result:', result);

        if(!result.isVerified){
            console.log('❌ Checksum verification failed');
            const frontendUrl = process.env.FRONTEND_URL || 'https://fitsport.io.vn';
            const redirectUrl = `${frontendUrl}/payment-success?success=false&code=97`;
            console.log('Redirecting to:', redirectUrl);
            return res.redirect(redirectUrl);
        }

        //tìm order
        const order = await Oders.findOne({
            vnpay_transaction_id: vnp_TxnRef
        });

        if(!order){
            console.log('❌ Order not found for transaction:', vnp_TxnRef);
            const frontendUrl = process.env.FRONTEND_URL || 'https://fitsport.io.vn';
            const redirectUrl = `${frontendUrl}/payment-success?success=false&code=01`;
            console.log('Redirecting to:', redirectUrl);
            return res.redirect(redirectUrl);
        }

        console.log('✅ Order found:', order._id);

        // Redirect về frontend với thông tin
        const frontendUrl = process.env.FRONTEND_URL || 'https://fitsport.io.vn';
        
        if(vnp_ResponseCode === "00"){
            const redirectUrl = `${frontendUrl}/payment-success?success=true&code=00&orderId=${order._id}&orderCode=${order.order_code}`;
            console.log('✅ Payment successful, redirecting to:', redirectUrl);
            return res.redirect(redirectUrl);
        } else {
            const redirectUrl = `${frontendUrl}/payment-success?success=false&code=${vnp_ResponseCode}`;
            console.log('❌ Payment failed, redirecting to:', redirectUrl);
            return res.redirect(redirectUrl);
        }
    }catch(error){
        console.error('❌ Return URL Error:', error);
        console.error('Error stack:', error.stack);
        const frontendUrl = process.env.FRONTEND_URL || 'https://fitsport.io.vn';
        const redirectUrl = `${frontendUrl}/payment-success?success=false&code=99`;
        console.log('Redirecting to:', redirectUrl);
        return res.redirect(redirectUrl);
    }
}