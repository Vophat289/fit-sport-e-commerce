// src/controllers/order.controller.js
import Oders from "../models/oders.model.js";
import OdersDetails from "../models/odersDetails.model.js";
import ProductsVariant from "../models/productsVariant.model.js";

/**
 * ================================
 * GET: Danh sách đơn hàng của user
 * - COD: luôn hiện
 * - VNPAY: CHỈ hiện khi payment_status = PAID
 * ================================
 */
export const getOrdersByUser = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const orders = await Oders.find({
      user_id: userId,
      $or: [
        { payment_method: "COD" },
        { payment_method: "VNPAY", payment_status: "PAID" }
      ]
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("❌ getOrdersByUser:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

/**
 * ================================
 * GET: Chi tiết đơn hàng
 * - Check quyền user
 * ================================
 */
export const getOrderDetail = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id || req.user.id;

    const order = await Oders.findOne({
      _id: orderId,
      user_id: userId
    });

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const details = await OdersDetails.find({ order_id: orderId }).populate({
      path: "variant_id",
      select: "product_id size_id color_id image_url price",
      populate: [
        { path: "product_id", select: "name image" },
        { path: "size_id", model: "Size", select: "name" },
        { path: "color_id", model: "Color", select: "name hex_code" },
      ],
    });

    const formattedItems = details.map((item) => {
      const variant = item.variant_id;
      const product = variant?.product_id;

      return {
        _id: item._id,
        quantity: item.quantity,
        price: variant?.price || item.price,
        variant_id: variant?._id,
        variant: {
          size: variant?.size_id?.name || "N/A",
          color: variant?.color_id?.name || "N/A",
          image: variant?.image_url || product?.image || [],
        },
        product: {
          _id: product?._id,
          name: product?.name || "Sản phẩm",
          image: product?.image || [],
        },
        displayName: product?.name || "Sản phẩm",
        displayImage: variant?.image_url || product?.image?.[0] || "",
      };
    });

    res.json({ order, items: formattedItems });
  } catch (error) {
    console.error("❌ Lỗi getOrderDetail:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

/**
 * ================================
 * PUT: Hủy đơn hàng
 * - COD: cho hủy nếu chưa giao
 * - VNPAY: KHÔNG cho hủy nếu đã PAID (chưa hoàn tiền)
 * ================================
 */
export const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user._id || req.user.id;

    const order = await Oders.findOne({
      _id: orderId,
      user_id: userId
    });

    if (!order) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại" });
    }

    if (["DELIVERED", "CANCELLED"].includes(order.status)) {
      return res.status(400).json({ message: "Không thể hủy đơn hàng này" });
    }

    // ❌ Không cho hủy đơn VNPAY đã thanh toán
    if (order.payment_method === "VNPAY" && order.payment_status === "PAID") {
      return res.status(400).json({
        message: "Đơn hàng VNPAY đã thanh toán, vui lòng liên hệ CSKH để hoàn tiền"
      });
    }

    const details = await OdersDetails.find({ order_id: orderId });

    // Hoàn kho
    await Promise.all(
      details.map(async (item) => {
        if (item.variant_id) {
          await ProductsVariant.findByIdAndUpdate(item.variant_id, {
            $inc: { quantity: item.quantity },
          });
        }
      })
    );

    order.status = "CANCELLED";
    await order.save();

    res.json({ message: "Hủy đơn hàng thành công", order });
  } catch (error) {
    console.error("❌ cancelOrder:", error);
    res.status(500).json({ message: "Lỗi server khi hủy đơn hàng" });
  }
};
