import mongoose from 'mongoose';
import Review from '../../models/review.model.js';

export const getAllReviews = async (req, res) => {
  try {
    const { productId, orderId, status } = req.query;

    const filter = {};

    // chỉ thêm điều kiện khi query có giá trị thật
    if (productId && productId !== 'null' && productId !== 'undefined') {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ success: false, message: 'productId không hợp lệ' });
      }
      filter.product = productId;
    }

    if (orderId && orderId !== 'null' && orderId !== 'undefined') {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ success: false, message: 'orderId không hợp lệ' });
      }
      filter.order = orderId;
    }

    if (status && status !== 'all') {
      const allowed = ['pending', 'approved', 'rejected'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, message: 'status không hợp lệ' });
      }
      filter.status = status;
    }

    const reviews = await Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name')
      // ⚠️ chỉ populate order nếu bạn đã có Order model (nếu chưa thì bỏ dòng này)
      // .populate('order')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, total: reviews.length, data: reviews });
  } catch (err) {
    console.error('getAllReviews error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};