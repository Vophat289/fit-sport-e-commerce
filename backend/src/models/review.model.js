// src/models/review.model.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: 'Account', 
      ref: 'User', 
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// 1 user chỉ được review 1 lần / 1 sản phẩm /đơn
reviewSchema.index({ product: 1, user: 1, order: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;