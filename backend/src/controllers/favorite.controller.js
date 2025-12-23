// controllers/favorite.controller.js
import Favorite from '../models/favorite.model.js';
import Product from '../models/product.model.js';
import ProductsVariant from '../models/productsVariant.model.js';

/**
 * Lấy danh sách sản phẩm yêu thích của user
 */
export const getFavorites = async (req, res) => {
  try {
    // Lấy tất cả favorite của user và populate thông tin sản phẩm
    const favorites = await Favorite.find({ userId: req.user._id }).populate('productId');

    // Lọc những sản phẩm tồn tại, tránh null nếu sản phẩm đã bị xóa
    const data = await Promise.all(
      favorites
        .filter(f => f.productId)
        .map(async (f) => {
          // Lấy giá từ variant đầu tiên (giống như trang danh sách sản phẩm)
          const firstVariant = await ProductsVariant.findOne({ product_id: f.productId._id })
            .sort({ createdAt: 1 })
            .lean();
          
          const displayPrice = firstVariant?.price || f.productId.price || 0;
          
          return {
            _id: f.productId._id,
            name: f.productId.name,
            price: displayPrice,
            displayPrice: displayPrice,
            slug: f.productId.slug,
            image: f.productId.image,
            viewCount: f.productId.viewCount,
          };
        })
    );

    res.json(data);
  } catch (error) {
    console.error('Lỗi getFavorites:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Thêm sản phẩm vào yêu thích
 */
export const addFavorite = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) return res.status(400).json({ message: 'productId là bắt buộc' });

    // Kiểm tra xem sản phẩm đã được yêu thích chưa
    const exists = await Favorite.findOne({ userId: req.user._id, productId });
    if (exists) return res.status(409).json({ message: 'Sản phẩm đã yêu thích rồi' });

    // Tạo mới favorite
    const favorite = await Favorite.create({
      userId: req.user._id,
      productId
    });

    // Trả về danh sách favorites mới (giống như frontend mong đợi)
    const favorites = await Favorite.find({ userId: req.user._id }).populate('productId');
    const data = await Promise.all(
      favorites
        .filter(f => f.productId)
        .map(async (f) => {
          const firstVariant = await ProductsVariant.findOne({ product_id: f.productId._id })
            .sort({ createdAt: 1 })
            .lean();
          const displayPrice = firstVariant?.price || f.productId.price || 0;
          return {
            _id: f.productId._id,
            name: f.productId.name,
            price: displayPrice,
            displayPrice: displayPrice,
            slug: f.productId.slug,
            image: f.productId.image,
            viewCount: f.productId.viewCount,
          };
        })
    );

    res.status(201).json(data);
  } catch (error) {
    console.error('Lỗi addFavorite:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Xóa sản phẩm khỏi yêu thích
 */
export const removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) return res.status(400).json({ message: 'productId là bắt buộc' });

    const deleted = await Favorite.findOneAndDelete({ userId: req.user._id, productId });
    if (!deleted) return res.status(404).json({ message: 'Sản phẩm không tồn tại trong yêu thích' });

    // Trả về danh sách favorites mới (giống như frontend mong đợi)
    const favorites = await Favorite.find({ userId: req.user._id }).populate('productId');
    const data = await Promise.all(
      favorites
        .filter(f => f.productId)
        .map(async (f) => {
          const firstVariant = await ProductsVariant.findOne({ product_id: f.productId._id })
            .sort({ createdAt: 1 })
            .lean();
          const displayPrice = firstVariant?.price || f.productId.price || 0;
          return {
            _id: f.productId._id,
            name: f.productId.name,
            price: displayPrice,
            displayPrice: displayPrice,
            slug: f.productId.slug,
            image: f.productId.image,
            viewCount: f.productId.viewCount,
          };
        })
    );

    res.json(data);
  } catch (error) {
    console.error('Lỗi removeFavorite:', error);
    res.status(500).json({ message: error.message });
  }
};
