// src/controllers/admin/news.admin.controller.js
import News from '../../models/news.model.js';
import fs from 'fs';
import path from 'path';
import slugify from 'slugify';

// Tạo slug duy nhất
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

// ==================== ADMIN FUNCTIONS ====================

// LẤY TẤT CẢ BÀI VIẾT (ADMIN + PHÂN TRANG)
export const getAllNews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const total = await News.countDocuments();
    const news = await News.find()
      .select('title slug short_desc content thumbnail author tags createdAt updatedAt isActive')
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
    res.status(500).json({ success: false, message: "Lỗi server khi tải danh sách bài viết" });
  }
};

// TẠO BÀI VIẾT MỚI
export const createNews = async (req, res) => {
  try {
    const { title, content, short_desc, author, tags } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ success: false, message: "Tiêu đề và nội dung là bắt buộc!" });
    }

    const thumbnail = req.file ? `/uploads/news/${req.file.filename}` : null;

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
      message: "Tạo bài viết thành công!",
      data: newNews
    });

  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Lỗi createNews:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi tạo bài viết" });
  }
};

// CẬP NHẬT BÀI VIẾT THEO SLUG
export const updateNewsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const news = await News.findOne({ slug });

    if (!news) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy bài viết với slug: ${slug}`
      });
    }

    const { title, content, short_desc, author, tags, isActive } = req.body;

    if (title && title.trim() !== news.title) {
      news.title = title.trim();
      news.slug = await generateUniqueSlug(title.trim());
    }
    if (content !== undefined) news.content = content.trim();
    if (short_desc !== undefined) news.short_desc = short_desc?.trim() || '';
    if (author !== undefined) news.author = author?.trim() || 'Admin';
    if (isActive !== undefined) news.isActive = isActive === true || isActive === 'true';

    if (tags !== undefined) {
      news.tags = typeof tags === 'string'
        ? tags.split(',').map(t => t.trim()).filter(Boolean)
        : Array.isArray(tags) ? tags : [];
    }

    if (req.file) {
      if (news.thumbnail) {
        const oldFileName = path.basename(news.thumbnail);
        const oldPath = path.join(process.cwd(), 'uploads', 'news', oldFileName);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      news.thumbnail = `/uploads/news/${req.file.filename}`;
    }

    await news.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật bài viết thành công!",
      data: news
    });

  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Lỗi updateNewsBySlug:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật bài viết",
      error: error.message
    });
  }
};

// ẨN / HIỆN BÀI VIẾT
export const toggleHideNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);

    if (!news) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    news.isActive = !news.isActive;
    await news.save();

    res.json({
      success: true,
      message: "Thay đổi trạng thái thành công",
      isActive: news.isActive
    });
  } catch (error) {
    console.error("Lỗi toggleHideNews:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// XÓA BÀI VIẾT (CHỈ 1 HÀM DUY NHẤT - ĐÃ SỬA HOÀN HẢO)
export const deleteNews = async (req, res) => {
  try {
    const { slug } = req.params;
    const news = await News.findOneAndDelete({ slug });

    if (!news) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    if (news.thumbnail) {
      const fileName = path.basename(news.thumbnail);
      const filePath = path.join(process.cwd(), 'uploads', 'news', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ success: true, message: "Xóa bài viết thành công!" });
  } catch (error) {
    console.error("Lỗi deleteNews:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi xóa" });
  }
};

// ==================== PUBLIC FUNCTIONS (CHO TRANG CHỦ & BÀI VIẾT) ====================

// 1. Lấy danh sách bài viết công khai (chỉ hiện bài isActive: true)
export const getPublicNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const news = await News.find({ isActive: true })
      .select('title slug short_desc thumbnail createdAt tags author')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await News.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: news,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    console.error("Lỗi getPublicNews:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// 2. Lấy bài mới nhất cho trang chủ
export const getLatestNews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const news = await News.find({ isActive: true })
      .select('title slug short_desc thumbnail createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// 3. Lấy chi tiết bài viết theo slug (chỉ hiện nếu isActive: true)
export const getNewsDetailBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const news = await News.findOne({ slug, isActive: true });

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "Bài viết không tồn tại hoặc đã bị ẩn"
      });
    }

    res.json({ success: true, data: news });
  } catch (error) {
    console.error("Lỗi getNewsDetailBySlug:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};