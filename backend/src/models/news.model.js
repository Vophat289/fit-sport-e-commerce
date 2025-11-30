import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  short_desc: { type: String, required: true },
  content: { type: String, required: true },
  thumbnail: { type: String, default: '' },
  author: { type: String, default: 'Admin' },
  tags: [{ type: String }],
  slug: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },  
  isActive: {
    type: Boolean,
    default: true   
  }
});

// Index để tìm kiếm nhanh hơn (tùy chọn)
newsSchema.index({ slug: 1 });
newsSchema.index({ createdAt: -1 });
newsSchema.index({ isActive: 1 });

export default mongoose.model('News', newsSchema);