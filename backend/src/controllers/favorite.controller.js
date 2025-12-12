// controllers/favorite.controller.js
import Favorite from '../models/Favorite.model.js';
import Products from '../models/product.model.js';

export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .populate('productId');

    const data = favorites.map(f => ({
      _id: f.productId._id,
      name: f.productId.name,
      price: f.productId.price,
      slug: f.productId.slug,
      image: f.productId.image,
      viewCount: f.productId.viewCount,
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const { productId } = req.body;

    const exists = await Favorite.findOne({
      userId: req.user._id,
      productId
    });

    if (exists) return res.status(400).json({ message: 'Đã yêu thích rồi' });

    const favorite = await Favorite.create({
      userId: req.user._id,
      productId
    });

    res.json(favorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    await Favorite.findOneAndDelete({
      userId: req.user._id,
      productId: req.params.productId
    });

    res.json({ message: 'Đã xóa khỏi yêu thích' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
