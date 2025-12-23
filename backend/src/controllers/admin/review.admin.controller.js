import mongoose from 'mongoose';
import Review from '../../models/review.model.js';

export const getAllReviews = async (req, res) => {
  try {
    const { productId, orderId, status, rating } = req.query;

    const filter = {};

    //  LỌC THEO SAO (rating)
    if (rating !== undefined && rating !== null && rating !== '') {
      const r = Number(rating);
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        return res.status(400).json({ success: false, message: 'rating không hợp lệ (1-5)' });
      }
      filter.rating = r;
    }

    //  LỌC THEO STATUS 
    if (status && status !== 'all') {
      const allowed = ['pending', 'approved', 'rejected'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, message: 'status không hợp lệ' });
      }
      filter.status = status;
    }

    const reviews = await Review.find(filter)
      .populate({
        path: 'user',
        select: 'name email',
        model: 'User'
      })
      .populate({
        path: 'product',
        select: 'name',
        model: 'Product'
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, total: reviews.length, data: reviews });
  } catch (err) {
    console.error('getAllReviews error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
