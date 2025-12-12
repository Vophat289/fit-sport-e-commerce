import mongoose from 'mongoose';

const FavoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', // match với tên model Product
      required: true
    }
  },
  { timestamps: true }
);

// 1 user không thể yêu thích 1 sản phẩm 2 lần
FavoriteSchema.index(
  { userId: 1, productId: 1 },
  { unique: true }
);

export default mongoose.model('Favorite', FavoriteSchema);
