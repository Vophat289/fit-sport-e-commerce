import News from '../../models/news.model.js';
import slugify from 'slugify';
import cloudinary from '../../config/cloudinary.js';

// ==================== ⚙️ CONFIG ====================
const SITE_DOMAIN = "https://fitsport.io.vn";
const CLOUDINARY_FOLDER = "news_thumbnails";

// ==================== 🔧 HELPER FUNCTIONS ====================

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

// Upload ảnh lên Cloudinary (Promise wrapper)
const uploadToCloudinary = async (fileBuffer) => {
  if (!fileBuffer) return null;
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: CLOUDINARY_FOLDER },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(fileBuffer);
    });
    return result.secure_url;
  } catch (err) {
    console.error("❌ Lỗi upload Cloudinary:", err.message);
    return null;
  }
};

// Chuẩn hóa URL thumbnail
const normalizeThumbnailUrl = (url) => {
  if (!url) return null;
  return url
    .replace("http://localhost:3000", SITE_DOMAIN)
    .replace("https://localhost:3000", SITE_DOMAIN)
    .replace("http://127.0.0.1:3000", SITE_DOMAIN);
};

// ==================== 🧩 ADMIN FUNCTIONS ====================

// 1️⃣ Lấy tất cả bài viết + phân trang
export const getAllNews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [total, news] = await Promise.all([
      News.countDocuments(),
      News.find()
        .select("title slug short_desc content thumbnail author tags createdAt updatedAt isActive")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      data: news,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi getAllNews:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi tải danh sách bài viết" });
  }
};

// 2️⃣ Tạo bài viết mới
export const createNews = async (req, res) => {
  try {
    const { title, content, short_desc, author, tags } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ success: false, message: "Tiêu đề và nội dung là bắt buộc!" });
    }

    // Upload ảnh nếu có
    let thumbnailUrl = req.file ? await uploadToCloudinary(req.file.buffer) : null;
    thumbnailUrl = normalizeThumbnailUrl(thumbnailUrl);

    const tagsArray = tags
      ? (typeof tags === "string"
          ? tags.split(",").map((t) => t.trim()).filter(Boolean)
          : Array.isArray(tags)
          ? tags
          : [])
      : [];

    const slug = await generateUniqueSlug(title.trim());

    const newNews = await News.create({
      title: title.trim(),
      slug,
      content: content.trim(),
      short_desc: short_desc?.trim() || "",
      thumbnail: thumbnailUrl,
      author: author?.trim() || "Admin",
      tags: tagsArray,
      isActive: true,
    });

    res.status(201).json({ success: true, message: "📰 Tạo bài viết thành công!", data: newNews });
  } catch (error) {
    console.error("❌ Lỗi createNews:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi tạo bài viết", error: error.message });
  }
};

// 3️⃣ Cập nhật bài viết theo slug
export const updateNewsBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const news = await News.findOne({ slug });
    if (!news) {
      return res.status(404).json({ success: false, message: `Không tìm thấy bài viết với slug: ${slug}` });
    }

    const { title, content, short_desc, author, tags, isActive } = req.body;

    if (title && title.trim() !== news.title) {
      news.title = title.trim();
      news.slug = await generateUniqueSlug(title.trim());
    }
    if (content !== undefined) news.content = content.trim();
    if (short_desc !== undefined) news.short_desc = short_desc?.trim() || "";
    if (author !== undefined) news.author = author?.trim() || "Admin";
    if (isActive !== undefined) news.isActive = isActive === true || isActive === "true";
    if (tags !== undefined) {
      news.tags =
        typeof tags === "string"
          ? tags.split(",").map((t) => t.trim()).filter(Boolean)
          : Array.isArray(tags)
          ? tags
          : [];
    }

    if (req.file) {
      let newThumbnail = await uploadToCloudinary(req.file.buffer);
      newThumbnail = normalizeThumbnailUrl(newThumbnail);
      news.thumbnail = newThumbnail;
    }

    await news.save();

    res.status(200).json({ success: true, message: "✅ Cập nhật bài viết thành công!", data: news });
  } catch (error) {
    console.error("❌ Lỗi updateNewsBySlug:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi cập nhật bài viết", error: error.message });
  }
};

// 4️⃣ Ẩn / Hiện bài viết
export const toggleHideNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);
    if (!news) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    news.isActive = !news.isActive;
    await news.save();

    res.json({
      success: true,
      message: news.isActive ? "👁️ Đã hiển thị bài viết" : "🚫 Đã ẩn bài viết",
      isActive: news.isActive,
    });
  } catch (error) {
    console.error("❌ Lỗi toggleHideNews:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// // 5️⃣ Xóa bài viết
export const deleteNews = async (req, res) => {
  try {
    const { slug } = req.params;
    const news = await News.findOneAndDelete({ slug });
    if (!news) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    res.json({ success: true, message: "🗑️ Xóa bài viết thành công!" });
  } catch (error) {
    console.error("❌ Lỗi deleteNews:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi xóa" });
  }
};

// ==================== 🌐 PUBLIC FUNCTIONS ====================

// Lấy danh sách bài viết công khai
export const getPublicNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const [news, total] = await Promise.all([
      News.find({ isActive: true })
        .select("title slug short_desc thumbnail createdAt tags author")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      News.countDocuments({ isActive: true }),
    ]);

    res.json({
      success: true,
      data: news,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi getPublicNews:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Lấy bài viết mới nhất cho trang chủ
export const getLatestNews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const news = await News.find({ isActive: true })
      .select("title slug short_desc thumbnail createdAt author tags")
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, data: news });
  } catch (error) {
    console.error("❌ Lỗi getLatestNews:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi lấy tin mới nhất" });
  }
};

// Lấy chi tiết bài viết theo slug
export const getNewsDetailBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ success: false, message: "Thiếu slug" });

    const news = await News.findOne({ slug, isActive: true });
    if (!news) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });

    res.json({ success: true, data: news });
  } catch (error) {
    console.error("❌ Lỗi getNewsDetailBySlug:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi lấy chi tiết bài viết" });
  }
};
