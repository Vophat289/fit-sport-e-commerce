import Review from "../models/review.model.js";
import Oders from "../models/oders.model.js";
import OdersDetails from "../models/odersDetails.model.js";
import ProductsVariant from "../models/productsVariant.model.js";

// Lấy tất cả review của 1 product (bao gồm review theo variant)
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate("user", "name") // lấy tên user
      .populate({
        path: "variant",
        select: "size_id color_id price",
        populate: [
          { path: "size_id", select: "name" },
          { path: "color_id", select: "name" },
        ],
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error("ERROR getProductReviews:", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

// Thêm review mới theo variant
export const addReview = async (req, res) => {
  try {
    const { variant_id, order_id, rating, comment } = req.body;
    const userId = req.user._id;

    // Lấy variant
    const variant = await ProductsVariant.findById(variant_id);
    if (!variant) {
      return res.status(400).json({ success: false, message: "Variant không hợp lệ" });
    }

    // Lấy order
    const order = await Oders.findById(order_id);
    if (!order || order.user_id.toString() !== userId.toString()) {
      return res.status(400).json({ success: false, message: "Đơn hàng không hợp lệ" });
    }

    if (order.status.toUpperCase() !== "DELIVERED") {
      return res.status(400).json({ success: false, message: "Chỉ được đánh giá khi đơn hàng đã giao" });
    }

    // Kiểm tra user có mua variant này trong đơn không
    const orderDetail = await OdersDetails.findOne({
      order_id,
      variant_id,
    });

    if (!orderDetail) {
      return res.status(400).json({ success: false, message: "Bạn không mua biến thể này trong đơn hàng" });
    }

    // Kiểm tra review trùng lặp (user + order + variant)
    const existing = await Review.findOne({
      order: order_id,
      variant: variant_id,
      user: userId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        reviewed: true,
        message: "Bạn đã đánh giá biến thể này trong đơn hàng này rồi",
        review: existing,
      });
    }

    // Tạo review mới
    const review = new Review({
      product: variant.product_id, // Lấy product từ variant
      variant: variant_id,
      user: userId,
      order: order_id,
      rating,
      comment,
      status: "approved",
    });

    await review.save();

    return res.status(201).json({
      reviewed: false,
      success: true,
      message: "Đánh giá thành công",
      review,
    });
  } catch (error) {
    console.error("ERROR addReview:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Lấy tất cả review của user
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;

    const reviews = await Review.find({ user: userId }).select(
      "product variant order rating comment createdAt"
    );

    // Trả về dạng key: `${order_id}_${variant_id}` để frontend đánh dấu
    const reviewKeys = {};
    reviews.forEach((r) => {
    if (r.order && r.variant) {
      reviewKeys[`${r.order.toString()}_${r.variant.toString()}`] = true;
    }
  });

    res.json({ success: true, data: reviews, reviewKeys });
  } catch (err) {
    console.error("ERROR getUserReviews:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
