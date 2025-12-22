 import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductsVariant',
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
      ref: 'Oders',
      required: true,
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

// 1 user chỉ được review 1 lần / 1 biến thể / 1 đơn
reviewSchema.index({ user: 1, order: 1, variant: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;