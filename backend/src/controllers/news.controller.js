// controllers/news.controller.js
import News from '../models/news.model.js';
import fs from 'fs';
import slugify from 'slugify';

const DEFAULT_THUMBNAIL = "";

// Hàm tạo slug đẹp + không trùng
const generateUniqueSlug = async (title) => {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    trim: true
  });

  let slug = baseSlug;
  let counter = 1;

  while (await News.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// LẤY TẤT CẢ TIN TỨC + PHÂN TRANG
export const getAllNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; 
    const skip = (page - 1) * limit;

    const total = await News.countDocuments();
    const totalPages = Math.ceil(total / limit);

    const news = await News.find()
      .select('title short_desc thumbnail author tags createdAt slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      data: news,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Lỗi getAllNews:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// === LẤY 4 BÀI VIẾT MỚI NHẤT (dùng cho trang chủ) ===
export const getLatestNews = async (req, res) => {
  try {
    const latestNews = await News.find()
      .select('title short_desc thumbnail author createdAt slug')
      .sort({ createdAt: -1 })
      .limit(12);                     

    res.status(200).json(latestNews);
  } catch (error) {
    console.error("Lỗi getLatestNews:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// GET BY ID
export const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: "Không tìm thấy tin tức" });
    res.status(200).json(news);
  } catch (error) {
    console.error("Lỗi getNewsById:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// GET BY SLUG
export const getNewsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ message: "Thiếu slug" });

    const news = await News.findOne({ slug });
    if (!news) return res.status(404).json({ message: "Không tìm thấy bài viết" });

    res.status(200).json(news);
  } catch (error) {
    console.error("Lỗi getNewsBySlug:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// CREATE
export const createNews = async (req, res) => {
  console.log("CREATE BODY:", req.body);
  console.log("CREATE FILE:", req.file);

  try {
    const { title, content, short_desc, author, tags, thumbnail } = req.body;

    if (!title?.trim()) return res.status(400).json({ message: "Tiêu đề là bắt buộc" });
    if (!content?.trim()) return res.status(400).json({ message: "Nội dung là bắt buộc" });
    if (!short_desc?.trim()) return res.status(400).json({ message: "Mô tả ngắn là bắt buộc" });

    let thumbnailUrl = DEFAULT_THUMBNAIL;

    if (thumbnail && thumbnail.trim()) {
      thumbnailUrl = thumbnail.trim();
    } else if (req.file) {
      // thumbnailUrl = `/uploads/loreq.file.filename}`;
    }

    let tagsArray = [];
    if (typeof tags === "string" && tags.trim()) {
      tagsArray = tags.split(",").map(t => t.trim()).filter(t => t);
    } else if (Array.isArray(tags)) {
      tagsArray = tags.map(t => t.trim()).filter(t => t);
    }

    const slug = await generateUniqueSlug(title.trim());

    const news = await News.create({
      title: title.trim(),
      slug,
      short_desc: short_desc.trim(),
      content: content.trim(),
      thumbnail: thumbnailUrl,
      author: author?.trim() || "Admin",
      tags: tagsArray,
    });

    res.status(201).json({ message: "Tạo tin tức thành công!", data: news });
  } catch (error) {
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch { }
    }
    console.error("Lỗi createNews:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// UPDATE
export const updateNews = async (req, res) => {
  console.log("UPDATE BODY:", req.body);
  console.log("UPDATE FILE:", req.file);

  try {
    const { id } = req.params;

    if (!req.body) {
      return res.status(400).json({ message: "Dữ liệu update trống. Hãy gửi form-data hoặc JSON." });
    }

    const { title, content, short_desc, author, tags, thumbnail } = req.body;

    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: "Không tìm thấy tin tức" });

    if (thumbnail && thumbnail.trim()) {
      news.thumbnail = thumbnail.trim();
    } else if (req.file) {
      news.thumbnail = `/uploads/news/${req.file.filename}`;
    }

    if (title?.trim() && title.trim() !== news.title) {
      news.title = title.trim();
      news.slug = await generateUniqueSlug(title.trim());
    }

    if (content?.trim()) news.content = content.trim();
    if (short_desc?.trim()) news.short_desc = short_desc.trim();
    if (author?.trim()) news.author = author.trim();

    if (tags !== undefined) {
      if (typeof tags === "string") {
        news.tags = tags.split(",").map(t => t.trim());
      } else if (Array.isArray(tags)) {
        news.tags = tags.map(t => t.trim());
      } else {
        news.tags = [];
      }
    }

    await news.save();

    res.status(200).json({ message: "Cập nhật tin tức thành công!", data: news });
  } catch (error) {
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch { }
    }
    console.error("Lỗi updateNews:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// DELETE
export const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await News.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy tin tức để xóa" });

    res.status(200).json({ message: "Xóa tin tức thành công!" });
  } catch (error) {
    console.error("Lỗi deleteNews:", error);
    res.status(500).json({ message: "Lỗi khi xóa tin tức" });
  }
};
