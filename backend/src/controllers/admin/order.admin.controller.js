import Oders from "../../models/oders.model.js";
import OdersDetails from "../../models/odersDetails.model.js";
import ProductsVariant from "../../models/productsVariant.model.js";
import User from "../../models/user.model.js";

/* ================= GET ALL ORDERS ================= */
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "", payment_status = "", payment_method = "", search = "" } = req.query;

    const query = { status: { $ne: "CART" } };

    if (status) query.status = status;
    if (payment_status) query.payment_status = payment_status;
    if (payment_method) query.payment_method = payment_method;

    if (search) {
      query.$or = [
        { order_code: { $regex: search, $options: "i" } },
        { receiver_name: { $regex: search, $options: "i" } },
        { receiver_mobile: { $regex: search, $options: "i" } }
      ];
    }

    const total = await Oders.countDocuments(query);

    const orders = await Oders.find(query)
      .populate({ path: "user_id", select: "name email phone", model: User })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit)
      .lean();

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      order_code: order.order_code,
      user: {
        name: order.user_id?.name || order.receiver_name || "N/A",
        email: order.user_id?.email || "N/A",
        phone: order.user_id?.phone || order.receiver_mobile || "N/A"
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
    }));

    res.json({ success: true, total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit), orders: formattedOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

/* ================= GET ORDER DETAIL ================= */
export const getOrderDetail = async (req, res) => {
  try {
    const order = await Oders.findById(req.params.id)
      .populate({ path: "user_id", select: "name email phone", model: User })
      .populate({ path: "voucher_id", select: "code value type" })
      .lean();

    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    const details = await OdersDetails.find({ order_id: order._id })
      .populate({
        path: "variant_id",
        populate: [
          { path: "product_id", select: "name slug image" },
          { path: "size_id", select: "name" },
          { path: "color_id", select: "name hex_code" }
        ]
      })
      .lean();

    const items = details.map(i => ({
      quantity: i.quantity,
      price: i.price,
      subtotal: i.price * i.quantity,
      product: {
        name: i.variant_id?.product_id?.name,
        slug: i.variant_id?.product_id?.slug,
        image: i.variant_id?.product_id?.image?.[0]
      },
      variant: {
        size: i.variant_id?.size_id?.name,
        color: i.variant_id?.color_id?.name,
        colorHex: i.variant_id?.color_id?.hex_code
      }
    }));

    res.json({
      success: true,
      order: {
        _id: order._id,
        order_code: order.order_code,
        user: order.user_id,
        receiver: {
          name: order.receiver_name,
          mobile: order.receiver_mobile,
          address: order.receiver_address
        },
        items,
        pricing: {
          total_items: items.reduce((s, i) => s + i.subtotal, 0),
          delivery_fee: order.delivery_fee,
          final_amount: order.total_price + order.delivery_fee
        },
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

/* ================= UPDATE ORDER STATUS (ĐÃ SỬA LOGIC) ================= */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Oders.findById(req.params.id);

    if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });

    const validStatuses = ['PENDING','CONFIRMED','PROCESSING','SHIPPING','DELIVERED','CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    if (['DELIVERED','CANCELLED'].includes(order.status)) {
      return res.status(400).json({ success: false, message: "Không thể thay đổi trạng thái này" });
    }

    const flow = {
      PENDING: ['CONFIRMED','CANCELLED'],
      CONFIRMED: ['PROCESSING','CANCELLED'],
      PROCESSING: ['SHIPPING','CANCELLED'],
      SHIPPING: ['DELIVERED']
    };

    if (!flow[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ ${order.status} sang ${status}`
      });
    }

    if (status === 'CANCELLED') {
      const details = await OdersDetails.find({ order_id: order._id });
      await Promise.all(details.map(d =>
        ProductsVariant.findByIdAndUpdate(d.variant_id, { $inc: { quantity: d.quantity } })
      ));
    }

    if (status === 'DELIVERED' && order.payment_method === 'COD') {
      order.payment_status = 'SUCCESS';
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      order: {
        _id: order._id,
        status: order.status,
        payment_status: order.payment_status,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

/* ================= GET ORDER STATS ================= */
export const getOrderStats = async (req, res) => {
  try {
    const orders = await Oders.find({ status: { $ne: "CART" }, payment_status: "SUCCESS" }).lean();

    res.json({
      success: true,
      stats: {
        total_orders: orders.length,
        total_revenue: orders.reduce((s, o) => s + o.total_price + o.delivery_fee, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};
