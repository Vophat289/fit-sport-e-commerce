import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  short_desc: { type: String, required: true },
  content: { type: String, required: true },
  thumbnail: { type: String, default: '' },
  author: { type: String, default: 'Admin' },
  tags: [{ type: String }],
  slug: { type: String, required: true, unique: true }, 
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('News', newsSchema);