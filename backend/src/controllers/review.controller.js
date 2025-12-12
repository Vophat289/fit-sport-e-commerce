import Review from "../models/review.model.js";
import Oders from "../models/oders.model.js";

export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate("user", "name") // lấy tên user
      .sort({ createdAt: -1 }); // mới nhất trước

    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error("ERROR getProductReviews:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: err.message });
  }
};
export const addReview = async (req, res) => {
  try {
    const { product_id, order_id, rating, comment } = req.body;
    const userId = req.user._id;

    // Lấy order
    const order = await Oders.findById(order_id);

    if (!order || order.user_id.toString() !== userId.toString()) {
      return res.status(400).json({
        reviewed: false,
        success: false,
        message: "Đơn hàng không hợp lệ",
      });
    }

    if (order.status.toUpperCase() !== "DELIVERED") {
      return res.status(400).json({
        reviewed: false,
        success: false,
        message: "Chỉ được đánh giá khi đơn hàng đã giao",
      });
    }

    // Kiểm tra review trùng lặp chỉ trong cùng 1 đơn hàng và cùng sản phẩm
    const existing = await Review.findOne({
      order: order_id,
      product: product_id,
      user: userId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        reviewed: true,
        message: "Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi",
        review: existing,
      });
    }

    // Tạo review mới
    const review = new Review({
      product: product_id,
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
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// Lấy tất cả review của user
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;

    const reviews = await Review.find({ user: userId }).select(
      "product order rating comment createdAt"
    );

    // Trả về dạng key: `${order_id}_${product_id}` để frontend đánh dấu
    const reviewKeys = {};
    reviews.forEach((r) => {
      reviewKeys[`${r.order.toString()}_${r.product.toString()}`] = true;
    });

    res.json({ success: true, data: reviews, reviewKeys });
  } catch (err) {
    console.error("ERROR getUserReviews:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};
