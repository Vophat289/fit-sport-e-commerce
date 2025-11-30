// src/controllers/admin/news.controller.js
import News from '../../models/news.model.js';
import fs from 'fs';
import path from 'path';
import slugify from 'slugify';

// Tạo slug không trùng (rất ổn định)
const generateUniqueSlug = async (title) => {
  const baseSlug = slugify(title, { lower: true, strict: true, trim: true });
  let slug = baseSlug;
  let counter = 1;

  while (await News.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};

// GET tất cả bài viết (admin) - có phân trang
export const getAllNews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const total = await News.countDocuments();
    const news = await News.find()
      .select('title slug short_desc content thumbnail author tags createdAt isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: news,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Lỗi getAllNews:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi tải danh sách" });
  }
};

// TẠO BÀI VIẾT MỚI - ĐÃ FIX 100% LỖI 500
export const createNews = async (req, res) => {
  try {
    const { title, content, short_desc, author, tags } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ success: false, message: "Tiêu đề và nội dung là bắt buộc!" });
    }

    // Xử lý ảnh
    const thumbnail = req.file 
      ? `/uploads/news/${req.file.filename}` 
      : null;

    // Xử lý tags an toàn
    const tagsArray = tags
      ? (typeof tags === 'string' 
          ? tags.split(',').map(t => t.trim()).filter(Boolean)
          : Array.isArray(tags) ? tags : [])
      : [];

    const slug = await generateUniqueSlug(title.trim());

    const newNews = new News({
      title: title.trim(),
      slug,
      content: content.trim(),
      short_desc: short_desc?.trim() || '',
      thumbnail,
      author: author?.trim() || 'Admin',
      tags: tagsArray,
      isActive: true
    });

    await newNews.save();

    res.status(201).json({
      success: true,
      message: "Đăng bài thành công!",
      data: newNews
    });

  } catch (error) {
    // Xóa file nếu upload lỗi
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Lỗi createNews:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi tạo bài viết" });
  }
};

// CẬP NHẬT BÀI VIẾT - ĐÃ FIX HOÀN TOÀN
export const updateNews = async (req, res) => {
  try {
    const { slug } = req.params;
    const oldNews = await News.findOne({ slug });
    if (!oldNews) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    const { title, content, short_desc, author, tags } = req.body;

    // Cập nhật các trường
    if (title?.trim() && title.trim() !== oldNews.title) {
      oldNews.title = title.trim();
      oldNews.slug = await generateUniqueSlug(title.trim());
    }
    if (content?.trim()) oldNews.content = content.trim();
    if (short_desc !== undefined) oldNews.short_desc = short_desc?.trim() || '';
    if (author?.trim()) oldNews.author = author.trim();

    // Cập nhật tags
    if (tags !== undefined) {
      oldNews.tags = typeof tags === 'string'
        ? tags.split(',').map(t => t.trim()).filter(Boolean)
        : Array.isArray(tags) ? tags : [];
    }

    // Cập nhật ảnh mới + xóa ảnh cũ
    if (req.file) {
      // Xóa ảnh cũ
      if (oldNews.thumbnail) {
        const oldPath = path.join(process.cwd(), 'uploads', 'news', path.basename(oldNews.thumbnail));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      oldNews.thumbnail = `/uploads/news/${req.file.filename}`;
    }

    await oldNews.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật bài viết thành công!",
      data: oldNews
    });

  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Lỗi updateNews:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi cập nhật" });
  }
};

// ẨN / BỎ ẨN BÀI VIẾT 
export const toggleHideNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    // Toggle trạng thái
    news.isActive = !news.isActive;
    await news.save();

    res.status(200).json({
      success: true,
      message: news.isActive ? "Đã bỏ ẩn bài viết" : "Đã ẩn bài viết",
      data: { _id: news._id, isActive: news.isActive }
    });

  } catch (error) {
    console.error("Lỗi toggleHideNews:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi thay đổi trạng thái" });
  }
};