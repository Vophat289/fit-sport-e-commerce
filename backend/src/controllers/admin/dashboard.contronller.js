import User from "../../models/user.model.js";
import Product from "../../models/product.model.js";

export const getDashboardData = async (req, res) => {
    try{
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();

        res.json({
            success: true,
            data: {
                totalUsers,
                totalProducts
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