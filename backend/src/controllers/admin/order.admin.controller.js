// src/controllers/admin/order.admin.controller.js
import Oders from "../../models/oders.model.js";
import OdersDetails from "../../models/odersDetails.model.js";
import ProductsVariant from "../../models/productsVariant.model.js";
import User from "../../models/user.model.js";

// GET danh sách đơn hàng (phân trang, filter, search)
export const getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = "", 
      payment_status = "",
      payment_method = "",
      search = "" 
    } = req.query;

    // Xây dựng query - chỉ lấy đơn hàng hợp lệ (không phải CART)
    const query = {
      status: { $ne: "CART" }
    };

    // Filter theo status
    if (status) {
      query.status = status;
    }

    // Filter theo payment_status
    if (payment_status) {
      query.payment_status = payment_status;
    }

    // Filter theo payment_method
    if (payment_method) {
      query.payment_method = payment_method;
    }

    // Search theo order_code, receiver_name, receiver_mobile
    if (search) {
      query.$or = [
        { order_code: { $regex: search, $options: "i" } },
        { receiver_name: { $regex: search, $options: "i" } },
        { receiver_mobile: { $regex: search, $options: "i" } }
      ];
    }

    const total = await Oders.countDocuments(query);

    // Lấy danh sách đơn hàng với thông tin user
    const orders = await Oders.find(query)
      .populate({
        path: 'user_id',
        select: 'name email phone',
        model: User
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Format dữ liệu để trả về
    const formattedOrders = orders.map(order => {
      const user = order.user_id || {};
      return {
        _id: order._id,
        order_code: order.order_code,
        user: {
          name: user.name || order.receiver_name || "N/A",
          email: user.email || "N/A",
          phone: user.phone || order.receiver_mobile || "N/A"
        },
        receiver: {
          name: order.receiver_name || "N/A",
          mobile: order.receiver_mobile || "N/A",
          address: order.receiver_address || "N/A"
        },
        total_price: order.total_price || 0,
        delivery_fee: order.delivery_fee || 0,
        final_amount: (order.total_price || 0) + (order.delivery_fee || 0),
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    });

    res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      orders: formattedOrders
    });

  } catch (error) {
    console.error("❌ Lỗi getAllOrders:", error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi server khi lấy danh sách đơn hàng",
      error: error.message 
    });
  }
};

// GET chi tiết đơn hàng
export const getOrderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Lấy thông tin đơn hàng
    const order = await Oders.findById(orderId)
      .populate({
        path: 'user_id',
        select: 'name email phone',
        model: User
      })
      .populate({
        path: 'voucher_id',
        select: 'code value type'
      })
      .lean();

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy đơn hàng" 
      });
    }

    // Lấy chi tiết đơn hàng (sản phẩm)
    const orderDetails = await OdersDetails.find({ order_id: orderId })
      .populate({
        path: "variant_id",
        select: "product_id size_id color_id image_url price",
        populate: [
          { 
            path: "product_id", 
            select: "name slug image",
            model: "Product"
          },
          { 
            path: "size_id", 
            model: "Size", 
            select: "name" 
          },
          { 
            path: "color_id", 
            model: "Color", 
            select: "name hex_code" 
          }
        ]
      })
      .lean();

    // Format chi tiết sản phẩm
    const formattedItems = orderDetails.map((item) => {
      const variant = item.variant_id || {};
      const product = variant.product_id || {};
      const size = variant.size_id || {};
      const color = variant.color_id || {};

      return {
        _id: item._id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        product: {
          _id: product._id,
          name: product.name || "N/A",
          slug: product.slug,
          image: product.image?.[0] || variant.image_url?.[0] || ""
        },
        variant: {
          size: size.name || "N/A",
          color: color.name || "N/A",
          colorHex: color.hex_code || "",
          image: variant.image_url?.[0] || product.image?.[0] || ""
        }
      };
    });

    // Tính tổng tiền
    const totalItems = formattedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const finalAmount = order.total_price + order.delivery_fee;

    // Format thông tin user
    const user = order.user_id || {};
    const userInfo = {
      name: user.name || order.receiver_name || "N/A",
      email: user.email || "N/A",
      phone: user.phone || order.receiver_mobile || "N/A"
    };

    res.json({
      success: true,
      order: {
        _id: order._id,
        order_code: order.order_code,
        user: userInfo,
        receiver: {
          name: order.receiver_name || "N/A",
          mobile: order.receiver_mobile || "N/A",
          address: order.receiver_address || "N/A"
        },
        items: formattedItems,
        pricing: {
          total_items: totalItems,
          total_price: order.total_price,
          delivery_fee: order.delivery_fee,
          voucher_discount: order.voucher_id ? (order.voucher_id.value || 0) : 0,
          final_amount: finalAmount
        },
        voucher: order.voucher_id ? {
          code: order.voucher_id.code,
          value: order.voucher_id.value,
          type: order.voucher_id.type
        } : null,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        vnpay_transaction_id: order.vnpay_transaction_id || null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });

  } catch (error) {
    console.error("❌ Lỗi getOrderDetail:", error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi server khi lấy chi tiết đơn hàng",
      error: error.message 
    });
  }
};

// PUT cập nhật trạng thái đơn hàng
export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    // Validate status
    // Trạng thái chính: PENDING, CONFIRMED, PROCESSING, SHIPPING, DELIVERED
    // Trạng thái phụ: CANCELLED
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: `Trạng thái không hợp lệ. Các trạng thái hợp lệ: ${validStatuses.join(', ')}` 
      });
    }

    // Tìm đơn hàng
    const order = await Oders.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy đơn hàng" 
      });
    }

    // Kiểm tra nếu đơn hàng đã bị hủy hoặc đã giao hàng
    if (order.status === 'CANCELLED' && status !== 'CANCELLED') {
      return res.status(400).json({ 
        success: false,
        message: "Không thể thay đổi trạng thái đơn hàng đã bị hủy" 
      });
    }

    if (order.status === 'DELIVERED' && status !== 'DELIVERED') {
      return res.status(400).json({ 
        success: false,
        message: "Không thể thay đổi trạng thái đơn hàng đã giao hàng" 
      });
    }

    // Nếu hủy đơn hàng, hoàn lại tồn kho
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      const orderDetails = await OdersDetails.find({ order_id: orderId });
      
      // Hoàn lại tồn kho cho từng sản phẩm
      await Promise.all(
        orderDetails.map(async (item) => {
          if (item.variant_id) {
            await ProductsVariant.findByIdAndUpdate(item.variant_id, {
              $inc: { quantity: item.quantity }
            });
          }
        })
      );
    }

    // Cập nhật trạng thái
    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      order: {
        _id: order._id,
        order_code: order.order_code,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });

  } catch (error) {
    console.error("❌ Lỗi updateOrderStatus:", error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi server khi cập nhật trạng thái đơn hàng",
      error: error.message 
    });
  }
};

// GET thống kê đơn hàng (tùy chọn - có thể dùng cho dashboard)
export const getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {
      status: { $ne: "CART" },
      payment_status: "SUCCESS"
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Oders.find(query).lean();

    const stats = {
      total_orders: orders.length,
      total_revenue: orders.reduce((sum, order) => {
        return sum + (order.total_price || 0) + (order.delivery_fee || 0);
      }, 0),
      by_status: {
        PENDING: 0,
        CONFIRMED: 0,
        PROCESSING: 0,
        SHIPPING: 0,
        DELIVERED: 0,
        CANCELLED: 0
      },
      by_payment_method: {
        COD: 0,
        VNPAY: 0
      }
    };

    orders.forEach(order => {
      if (stats.by_status[order.status] !== undefined) {
        stats.by_status[order.status]++;
      }
      if (stats.by_payment_method[order.payment_method]) {
        stats.by_payment_method[order.payment_method]++;
      }
    });

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error("❌ Lỗi getOrderStats:", error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi server khi lấy thống kê đơn hàng",
      error: error.message 
    });
  }
};

