// src/models/news.model.js
import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề là bắt buộc'],
      trim: true
    },
    short_desc: {
      type: String,
      required: [true, 'Mô tả ngắn là bắt buộc'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Nội dung bài viết là bắt buộc']
    },

    thumbnail: {
      type: String,
      default: null
    },

    author: {
      type: String,
      default: 'Admin',
      trim: true
    },

    tags: {
      type: [String],
      default: []
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Index tối ưu 
// createdAt đã có từ timestamps: true
newsSchema.index({ isActive: 1, createdAt: -1 }); 


export default mongoose.model('News', newsSchema);
