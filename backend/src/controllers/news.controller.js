import News from '../models/news.model.js';
import slugify from 'slugify';
import cloudinary from '../config/cloudinary.js';

const DEFAULT_THUMBNAIL = "";

// Tạo slug đẹp + không trùng
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

// GET ALL NEWS + phân trang
export const getAllNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const total = await News.countDocuments();
    const totalPages = Math.ceil(total / limit);

    const news = await News.find()
      .select('title short_desc thumbnail author tags createdAt slug isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      data: news,
      pagination: { currentPage: page, totalPages, totalItems: total, hasNext: page < totalPages, hasPrev: page > 1 }
    });
  } catch (error) {
    console.error("Lỗi getAllNews:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// GET LATEST NEWS (trang chủ)
export const getLatestNews = async (req, res) => {
  try {
    const latestNews = await News.find({ isActive: true })
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

// CREATE NEWS
export const createNews = async (req, res) => {
  try {
    const { title, content, short_desc, author, tags } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ message: "Tiêu đề và nội dung là bắt buộc" });
    if (!short_desc?.trim()) return res.status(400).json({ message: "Mô tả ngắn là bắt buộc" });

    let thumbnailUrl = DEFAULT_THUMBNAIL;
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload_stream(
        { folder: "news_thumbnails" },
        (error, result) => {
          if (error) throw error;
          thumbnailUrl = result.secure_url;
        }
      );
      uploadResult.end(req.file.buffer);
    }

    const tagsArray = typeof tags === "string" ? tags.split(",").map(t => t.trim()).filter(Boolean) : Array.isArray(tags) ? tags : [];

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
    console.error("Lỗi createNews:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// UPDATE NEWS
export const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: "Không tìm thấy tin tức" });

    const { title, content, short_desc, author, tags } = req.body;

    if (title?.trim() && title.trim() !== news.title) {
      news.title = title.trim();
      news.slug = await generateUniqueSlug(title.trim());
    }
    if (content?.trim()) news.content = content.trim();
    if (short_desc?.trim()) news.short_desc = short_desc.trim();
    if (author?.trim()) news.author = author.trim();

    if (tags !== undefined) {
      news.tags = typeof tags === "string" ? tags.split(",").map(t => t.trim()) : Array.isArray(tags) ? tags.map(t => t.trim()) : [];
    }

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload_stream(
        { folder: "news_thumbnails" },
        (error, result) => {
          if (error) throw error;
          news.thumbnail = result.secure_url;
        }
      );
      uploadResult.end(req.file.buffer);
    }

    await news.save();
    res.status(200).json({ message: "Cập nhật tin tức thành công!", data: news });
  } catch (error) {
    console.error("Lỗi updateNews:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// DELETE NEWS
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
