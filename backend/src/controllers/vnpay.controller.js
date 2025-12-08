import moment from "moment";
import { buildPayment, verifyIpn } from "../services/vnpay.service.js";
import Oders from "../models/oders.model.js";
import OdersDetails from "../models/odersDetails.model.js";
import ProductsVariant from "../models/productsVariant.model.js";

// Hàm hoàn lại tồn kho và khôi phục cart khi thanh toán thất bại
async function restoreCartAfterPaymentFailed(orderId) {
    try {
        // Lấy tất cả order details
        const orderDetails = await OdersDetails.find({ order_id: orderId });
        
        // Hoàn lại tồn kho cho từng item
        for (const item of orderDetails) {
            const variant = await ProductsVariant.findById(item.variant_id);
            if (variant) {
                variant.quantity += item.quantity;
                await variant.save();
                console.log(`Đã hoàn lại ${item.quantity} sản phẩm cho variant ${variant._id}`);
            }
        }
        
        console.log(`Đã hoàn lại tồn kho cho đơn hàng ${orderId}`);
    } catch (error) {
        console.error('Lỗi khi hoàn lại tồn kho:', error);
        throw error;
    }
}

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
    if(order.payment_status === 'SUCCESS'){
        return res.json({ RspCode: "00", Message: "Đã được xử lý"})
    }
    
    if(vnp_ResponseCode === "00" && vnp_TransactionStatus === "00"){
        //update trạng thái đơn hàng - Thanh toán thành công
        order.payment_status = 'SUCCESS';
        order.status = 'PENDING'; //giữ PENDING, admin sẽ xử lí đơn hàng
        await order.save();

        return res.json({ RspCode: "00", Message: "Thanh toán thành công"})
    }else{
        //update trạng thái đơn hàng - Thanh toán thất bại
        // Cần hoàn lại tồn kho và khôi phục cart
        await restoreCartAfterPaymentFailed(order._id);
        
        order.payment_status = 'FAILED';
        order.status = 'CART'; // Đổi về CART để user có thể checkout lại
        await order.save();

        return res.json({ RspCode: "07", Message: "Giao dịch không thành công"})
    }
   }catch(error){
        console.error('Lỗi xử lý IPN:', error);
        return res.json({ RspCode: "99", Message: "Lỗi server khi xử lý IPN" });
   }
}

//user redirect về sau khi thanh toán
export async function returnUrl(req, res){
    try{
        console.log('=== VNPay Return URL được gọi ===');
        console.log('Tham số query:', JSON.stringify(req.query, null, 2));
        
        const vnp_TxnRef = req.query.vnp_TxnRef;
        const vnp_ResponseCode = req.query.vnp_ResponseCode;

        //verify lại
        const result = verifyIpn(req.query);
        console.log('Kết quả xác thực:', result);

        if(!result.isVerified){
            console.log('Xác thực checksum thất bại');
            const frontendUrl = process.env.FRONTEND_URL || 'https://fitsport.io.vn';
            const redirectUrl = `${frontendUrl}/payment-success?success=false&code=97`;
            console.log('Chuyển hướng đến:', redirectUrl);
            return res.redirect(redirectUrl);
        }

        //tìm order
        const order = await Oders.findOne({
            vnpay_transaction_id: vnp_TxnRef
        });

        if(!order){
            console.log('Không tìm thấy đơn hàng cho giao dịch:', vnp_TxnRef);
            const frontendUrl = process.env.FRONTEND_URL || 'https://fitsport.io.vn';
            const redirectUrl = `${frontendUrl}/payment-success?success=false&code=01`;
            console.log('Chuyển hướng đến:', redirectUrl);
            return res.redirect(redirectUrl);
        }

        console.log('Tìm thấy đơn hàng:', order._id);

        // chuyển status giao dịch 
        const vnp_TransactionStatus = req.query.vnp_TransactionStatus;

        // Redirect về frontend với thông tin
        const frontendUrl = process.env.FRONTEND_URL || 'https://fitsport.io.vn';
        
        if(vnp_ResponseCode === "00" && vnp_TransactionStatus === "00"){

            // Chỉ update nếu chưa được update k bị duplicate
            if(order.payment_status !== 'SUCCESS'){
                order.payment_status = 'SUCCESS';
                order.status = 'PENDING'; // Giữ PENDING, admin sẽ xử lý đơn hàng
                await order.save();

                console.log('Cập nhật database thành công: payment_status = SUCCESS cho đơn hàng:', order._id);

            } else {
                console.log('Đơn hàng đã được cập nhật thành SUCCESS, bỏ qua cập nhật');
            }

            const redirectUrl = `${frontendUrl}/payment-success?success=true&code=00&orderId=${order._id}&orderCode=${order.order_code}`;
            console.log('Thanh toán thành công, chuyển hướng đến:', redirectUrl);
            return res.redirect(redirectUrl);
        } else {
            // Update trạng thái thanh toán thất bại
            if(order.payment_status !== 'FAILED'){
                // Hoàn lại tồn kho và khôi phục cart
                await restoreCartAfterPaymentFailed(order._id);
                
                order.payment_status = 'FAILED';
                order.status = 'CART'; // Đổi về CART để user có thể checkout lại
                await order.save();
                console.log('Cập nhật database: payment_status = FAILED, đã hoàn lại tồn kho cho đơn hàng:', order._id);
            }
            
            console.log(`Thanh toán thất bại: ResponseCode=${vnp_ResponseCode}, TransactionStatus=${vnp_TransactionStatus}`);
            const redirectUrl = `${frontendUrl}/payment-success?success=false&code=${vnp_ResponseCode}`;
            console.log('Chuyển hướng đến:', redirectUrl);
            return res.redirect(redirectUrl);
        }
    }catch(error){
        console.error('Lỗi Return URL:', error);
        console.error('Chi tiết lỗi:', error.stack);
        const frontendUrl = process.env.FRONTEND_URL || 'https://fitsport.io.vn';
        const redirectUrl = `${frontendUrl}/payment-success?success=false&code=99`;
        console.log('Chuyển hướng đến:', redirectUrl);
        return res.redirect(redirectUrl);
    }
}