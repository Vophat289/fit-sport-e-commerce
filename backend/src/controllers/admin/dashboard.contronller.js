import User from "../../models/user.model.js";
import Product from "../../models/product.model.js";
import OdersDetails from "../../models/odersDetails.model.js";
import ProductsVariant from "../../models/productsVariant.model.js";
import Orders from "../../models/oders.model.js";
import mongoose from "mongoose";

export const getDashboardData = async (req, res) => {
  try {
    // 1. Tổng Users & Products
    const [totalUsers, totalProducts] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
    ]);

    // 2. Lấy các đơn hàng hợp lệ (không phải CART)
    const paidOrders = await Orders.find({
      status: { $ne: "CART" },
      payment_status: { $in: [ "SUCCESS"] },
    });

    // 3. Tổng đơn hàng
    const totalOrders = paidOrders.length;

    // 4. Tổng doanh thu (bao gồm delivery_fee)
    const totalRevenue = paidOrders.reduce((sum, order) => {
      const price = order.total_price || 0;
      const ship = order.delivery_fee || 0;
      return sum + price + ship;
    }, 0);

    // 5. Doanh thu theo tháng (12 tháng gần nhất)
    const monthlyRevenue = {};

    paidOrders.forEach((order) => {
      const d = new Date(order.createdAt);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${m}`;

      if (!monthlyRevenue[key]) monthlyRevenue[key] = 0;
      monthlyRevenue[key] += (order.total_price || 0) + (order.delivery_fee || 0);
    });

    const now = new Date();
    const chartData = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${m}`;

      chartData.push({
        month: `T${m}`,
        revenue: monthlyRevenue[key] ? Math.round(monthlyRevenue[key]) : 0,
      });
    }

    // 6. Ngày cập nhật từng phần
    const updatedAt = {
      users: await User.findOne().sort({ updatedAt: -1 }).select("updatedAt"),
      products: await Product.findOne().sort({ updatedAt: -1 }).select("updatedAt"),
      orders: await Orders.findOne().sort({ updatedAt: -1 }).select("updatedAt"),
      revenue: await Orders.findOne({
        status: { $ne: "CART" },
        payment_status: { $in: ["SUCCESS","COD"] },
      })
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
export const getTopProducts = async (req, res) => {
  try {
    const pipeline = [
      // 1) join order để lọc trạng thái đơn hợp lệ
      {
        $lookup: {
          from: "oders", // collection name (model Oders -> collection 'oders')
          localField: "order_id",
          foreignField: "_id",
          as: "order",
        },
      },
      { $unwind: "$order" },

      // 2) chỉ lấy đơn hợp lệ 
      {
        $match: {
          "order.status": { $nin: ["CART", "CANCELLED"] },
          "order.payment_status": { $in: [ "SUCCESS", "COD"] },
        },
      },

      // 3) lookup variant để có product_id và ảnh variant
      {
        $lookup: {
          from: "productsvariants",
          localField: "variant_id",
          foreignField: "_id",
          as: "variant",
        },
      },
      { $unwind: "$variant" },

      // 4) lookup product
      {
        $lookup: {
          from: "products",
          localField: "variant.product_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },

      // 5) group theo product._id
      {
        $group: {
          _id: "$product._id",
          name: { $first: "$product.name" },
          image: { $first: { $arrayElemAt: ["$variant.image_url", 0] } }, 
          fallbackImage: { $first: { $arrayElemAt: ["$product.image", 0] } },
          price: { $first: "$product.price" },
          totalSold: { $sum: "$quantity" },
          totalRevenue: { $sum: { $multiply: ["$quantity", "$price"] } }, 
        },
      },

      // 6) project để trả về trường cần thiết (chọn ảnh ưu tiên)
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          totalSold: 1,
          totalRevenue: 1,
          image: {
            $cond: [
              { $ifNull: ["$image", false] },
              "$image",
              "$fallbackImage",
            ],
          },
        },
      },

      // 7) sort giảm dần theo totalSold
      { $sort: { totalSold: -1, totalRevenue: -1 } },
      { $limit: 5 },
    ];

    const top = await OdersDetails.aggregate(pipeline);

    const topFormatted = top.map((p) => ({
      productId: p._id?.toString?.() ?? p._id,
      name: p.name,
      image: p.image || null,
      price: p.price || 0,
      totalSold: p.totalSold || 0,
      totalRevenue: p.totalRevenue || 0,
    }));

    return res.json({ success: true, data: topFormatted });
  } catch (error) {
    console.error("getTopProducts error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};
