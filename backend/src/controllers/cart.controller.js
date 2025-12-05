// src/controllers/cart.controller.js
import Oders from "../models/oders.model.js";
import OdersDetails from "../models/odersDetails.model.js";
import ProductsVariant from "../models/productsVariant.model.js";

const generateOrderCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FS-${timestamp}-${random}`;
};
export const addToCart = async (req, res) => {
  try {
    if (!req.user) {
      // Người dùng chưa đăng nhập
      return res
        .status(401)
        .json({ message: "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng." });
    }

    const userId = req.user._id || req.user.id;
    const { productId, sizeId, colorId, quantity } = req.body;

    if (!productId || !sizeId || !colorId || !quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Dữ liệu sản phẩm không hợp lệ." });
    }

    const variant = await ProductsVariant.findOne({
      product_id: productId,
      size_id: sizeId,
      color_id: colorId,
    });

    if (!variant) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy biến thể sản phẩm phù hợp." });
    }
    if (variant.quantity < quantity) {
      return res
        .status(400)
        .json({ message: `Số lượng tồn kho chỉ còn ${variant.quantity}.` });
    }

    // Tìm hoặc tạo giỏ hàng
    let cart = await Oders.findOne({ user_id: userId, status: "CART" });
    if (!cart) {
      cart = await Oders.create({
        user_id: userId,
        order_code: generateOrderCode(),
        status: "CART",
        total_price: 0,
        delivery_fee: 0,
      });
    }

    // Thêm hoặc cập nhật chi tiết giỏ hàng
    let item = await OdersDetails.findOne({
      order_id: cart._id,
      variant_id: variant._id,
    });
    if (item) {
      item.quantity += quantity;
      item.price = variant.price;
      await item.save();
    } else {
      await OdersDetails.create({
        order_id: cart._id,
        variant_id: variant._id,
        price: variant.price,
        quantity,
      });
    }

    variant.quantity -= quantity;
    await variant.save();

    return res.status(200).json({
      message: "Đã thêm sản phẩm vào giỏ hàng thành công.",
      cartId: cart._id,
    });
  } catch (error) {
    console.error("Lỗi khi thêm vào giỏ hàng:", error.message, error.stack);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Lỗi định dạng ID sản phẩm." });
    }
    return res.status(500).json({ message: "Lỗi server khi xử lý giỏ hàng." });
  }
};

// XEM GIỎ HÀNG
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const cart = await Oders.findOne({ user_id: userId, status: "CART" });

    if (!cart) {
      return res
        .status(200)
        .json({ items: [], totalAmount: 0, message: "Giỏ hàng trống." });
    }

    const cartDetails = await OdersDetails.find({ order_id: cart._id })
      .lean()
      .populate({
        path: "variant_id",
        select: "product_id size_id color_id image_url price",
        populate: [
          { path: "product_id", select: "name slug" },
          { path: "size_id", model: "Size", select: "name" },
          { path: "color_id", model: "Color", select: "name hex_code" },
        ],
      });

    // 1. LỌC: Chỉ giữ lại các item mà populate thành công
    const validCartDetails = cartDetails.filter((item) => item.variant_id);

    // 2. TÍNH TOÁN TỔNG TIỀN AN TOÀN
    const totalAmount = validCartDetails.reduce((sum, item) => {
      const price = item.price || 0;
      const quantity = item.quantity || 0;
      return sum + price * quantity;
    }, 0);

    return res.status(200).json({
      cartId: cart._id,
      items: validCartDetails,
      totalAmount: totalAmount,
    });
  } catch (error) {
    console.error("LỖI GỐC TRONG GET CART:", error.message, error.stack);
    return res.status(500).json({
      message: "Lỗi server khi lấy thông tin giỏ hàng.",
      error: error.message,
    });
  }
};
//CẬP NHẬT SỐ LƯỢNG
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const itemId = req.params.itemId;
    const { quantity: newQuantity } = req.body;

    if (!newQuantity || newQuantity < 1) {
      return res.status(400).json({ message: "Số lượng không hợp lệ." });
    }

    // 1. Tìm item chi tiết giỏ hàng và xác minh quyền sở hữu
    const itemDetail = await OdersDetails.findOne({ _id: itemId }).populate({
      path: "order_id",
      match: { user_id: userId, status: "CART" },
    });

    if (!itemDetail || !itemDetail.order_id) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm hoặc bạn không có quyền sửa.",
      });
    }

    // 2. Tìm Variant và tính toán sự thay đổi tồn kho
    const variant = await ProductsVariant.findById(itemDetail.variant_id);

    if (!variant) {
      return res
        .status(404)
        .json({ message: "Lỗi: Không tìm thấy biến thể gốc của sản phẩm." });
    }

    const quantityDifference = newQuantity - itemDetail.quantity;

    // 3. Kiểm tra tồn kho trước khi tăng số lượng
    if (quantityDifference > 0 && variant.quantity < quantityDifference) {
      return res.status(400).json({
        message: `Không đủ tồn kho. Chỉ còn ${variant.quantity} sản phẩm có thể thêm.`,
      });
    }

    // 4. Cập nhật số lượng và Tồn kho
    itemDetail.quantity = newQuantity;
    variant.quantity -= quantityDifference;

    await itemDetail.save();
    await variant.save();

    return res.status(200).json({ message: "Cập nhật số lượng thành công." });
  } catch (error) {
    console.error("Lỗi khi cập nhật giỏ hàng:", error.message, error.stack);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Lỗi định dạng ID sản phẩm." });
    }
    return res
      .status(500)
      .json({ message: "Lỗi server khi cập nhật giỏ hàng." });
  }
};

// XÓA ITEM KHỎI GIỎ HÀNG
export const deleteCartItem = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const itemId = req.params.itemId; // ID của OdersDetails

    // 1. Tìm item để lấy thông tin hoàn lại tồn kho và order_id
    const itemDetail = await OdersDetails.findOne({ _id: itemId });

    if (!itemDetail) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm cần xóa trong giỏ hàng." });
    }

    // 2. Xác minh quyền sở hữu
    const cart = await Oders.findOne({
      _id: itemDetail.order_id,
      user_id: userId,
      status: "CART",
    });

    if (!cart) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa sản phẩm này." });
    }

    // 3. Hoàn lại tồn kho
    const variant = await ProductsVariant.findById(itemDetail.variant_id);

    if (variant) {
      variant.quantity += itemDetail.quantity;
      await variant.save();
    }

    // 4. Xóa item
    await OdersDetails.deleteOne({ _id: itemId });

    // 5. Kiểm tra và xóa Giỏ hàng (nếu trống)
    const remainingItemsCount = await OdersDetails.countDocuments({
      order_id: cart._id,
    });
    if (remainingItemsCount === 0) {
      await Oders.findByIdAndDelete(cart._id);
    }

    return res
      .status(200)
      .json({ message: "Xóa sản phẩm khỏi giỏ hàng thành công." });
  } catch (error) {
    console.error("Lỗi khi xóa giỏ hàng:", error.message, error.stack);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Lỗi định dạng ID sản phẩm." });
    }
    return res.status(500).json({ message: "Lỗi server khi xóa sản phẩm." });
  }
};
