import User from "../../models/user.model.js";
import Product from "../../models/product.model.js";
import Orders from "../../models/oders.model.js";

export const getDashboardData = async (req, res) => {
  try {
    // 1. Tổng User + Product
    const [totalUsers, totalProducts] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
    ]);

    // 2. Lấy đơn hàng thành công
    const paidOrders = await Orders.find({
      status: "DELIVERED",
      payment_status: "PAID",
    });

    // 3. Tổng đơn hàng
    const totalOrders = paidOrders.length;

    // 4. Tổng doanh thu thật
    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + order.total_price,
      0
    );

    // 5. Doanh thu theo tháng
    const monthlyRevenue = {};

    paidOrders.forEach((order) => {
      const d = new Date(order.createdAt);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${m}`;

      if (!monthlyRevenue[key]) monthlyRevenue[key] = 0;
      monthlyRevenue[key] += order.total_price;
    });

    // Tạo 12 tháng gần nhất
    const now = new Date();
    const chartData = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;

      const key = `${y}-${m}`;

      chartData.push({
        month: `T${m}`,
        revenue: monthlyRevenue[key]
          ? Math.round(monthlyRevenue[key] )
          : 0,
      });
    }

    // 6. Ngày cập nhật riêng của từng phần
    const updatedAt = {
      users: await User.findOne().sort({ updatedAt: -1 }).select("updatedAt"),
      products: await Product.findOne().sort({ updatedAt: -1 }).select("updatedAt"),
      orders: await Orders.findOne().sort({ updatedAt: -1 }).select("updatedAt"), 
      revenue: await Orders.findOne({ status: "DELIVERED", payment_status: "PAID" })
        .sort({ updatedAt: -1 })
        .select("updatedAt"), 
    };

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        chartData,
        updatedAt,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
