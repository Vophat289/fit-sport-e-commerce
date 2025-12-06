import User from "../../models/user.model.js";
import Product from "../../models/product.model.js";
import Oders from "../../models/oders.model.js";

export const getDashboardData = async (req, res) => {
    try{
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        
        // Tính tổng số đơn hàng (loại trừ CART - giỏ hàng)
        const totalOrders = await Oders.countDocuments({
            status: { $ne: 'CART' }
        });
        
        // Tính tổng doanh thu từ các đơn hàng đã thanh toán (PAID)
        const paidOrders = await Oders.find({
            payment_status: 'PAID',
            status: { $ne: 'CART' }
        });
        
        const totalRevenue = paidOrders.reduce((sum, order) => {
            return sum + (order.total_price || 0) + (order.delivery_fee || 0);
        }, 0);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue
            }
        });
    }catch(error){
        console.error("Error:", error);
        res.status(500).json({
            success: false,
            message:"Lỗi khi lấy dữ liệu"
        });
    }
}