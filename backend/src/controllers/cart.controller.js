// src/controllers/cart.controller.js

import Oders from "../models/oders.model.js";
import OdersDetails from "../models/odersDetails.model.js";
import ProductsVariant from "../models/productsVariant.model.js";
import Product from "../models/product.model.js"; // Import Product để đảm bảo model được register
import mongoose from "mongoose";
import Size from "../models/size.model.js";
import Color from "../models/color.model.js";
import { buildPayment } from "../services/vnpay.service.js";
import { validateVoucher, useVoucher } from "../services/voucher.service.js";

// Hàm hỗ trợ tạo mã đơn hàng
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

export const checkout = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { receiver_name, receiver_mobile, receiver_address, voucher_code } =
      req.body;

    //validate thông tin ng nhận
    if (!receiver_name || !receiver_mobile || !receiver_address) {
      return res
        .status(400)
        .json({ message: "Vui lòng điền đầy đủ thông tin người nhận." });
    }

    //tìm cart
    const cart = await Oders.findOne({
      user_id: userId,
      status: "CART",
    });

    if (!cart) {
      return res.status(404).json({ message: "Giỏ hàng trống" });
    }

    //lấy cart detail và vali
    const cartDetails = await OdersDetails.find({
      order_id: cart._id,
    }).populate({
      path: "variant_id",
      populate: [
        {
          path: "product_id",
          model: "Product", // Chỉ định rõ model name
          select: "name",
        },
      ],
    });

    if (!cartDetails || cartDetails.length === 0) {
      return res.status(404).json({ message: "Giỏ hàng không có sản phẩm" });
    }

    //validate tồn kho
    for (const item of cartDetails) {
      try {
        // Đảm bảo variant_id là ObjectId
        const variantId = item.variant_id?._id || item.variant_id;
        if (!variantId) {
          console.error("❌ Cart item không có variant_id:", item);
          return res.status(400).json({
            message: "Cart item không hợp lệ: thiếu variant_id",
          });
        }

        const variant = await ProductsVariant.findById(variantId);
        if (!variant) {
          console.error("❌ Không tìm thấy variant:", variantId);
          return res.status(400).json({
            message: "Không tìm thấy thông tin sản phẩm",
          });
        }

        if (variant.quantity < item.quantity) {
          const productName =
            item.variant_id?.product_id?.name ||
            variant.product_id?.name ||
            "N/A";
          return res.status(400).json({
            message: `Sản phẩm ${productName} không đủ tồn kho (chỉ còn ${variant.quantity}, cần ${item.quantity})`,
          });
        }
      } catch (itemError) {
        console.error("❌ Lỗi khi validate tồn kho item:", item, itemError);
        return res.status(400).json({
          message: "Lỗi khi kiểm tra tồn kho sản phẩm: " + itemError.message,
        });
      }
    }

    //tính tổng tiền
    let totalPrice = cartDetails.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    //tính phí giao hàng
    const shipping = 1000000;
    let deliveryFee = 0;
    if (totalPrice > 0 && totalPrice < shipping) {
      deliveryFee = 30000;
    }

    //xử lý voucher
    let voucherDiscount = 0;
    let voucherId = null;
    if (voucher_code) {
      try {
        const voucherResult = await validateVoucher(
          voucher_code,
          totalPrice + deliveryFee
        );

        if (voucherResult && voucherResult.valid) {
          voucherDiscount = voucherResult.discount || 0;
          voucherId = voucherResult.voucher?._id || null;
        }
      } catch (voucherError) {
        console.error(
          "❌ Lỗi khi validate voucher:",
          voucher_code,
          voucherError
        );
        // Không block checkout nếu voucher lỗi, chỉ bỏ qua voucher
        console.warn(
          "⚠️ Bỏ qua voucher do lỗi, tiếp tục checkout không có voucher"
        );
      }
    }

    const finalAmount = totalPrice + deliveryFee - voucherDiscount;

    if (finalAmount <= 0) {
      return res.status(400).json({ message: "Tổng tiền không hợp lệ" });
    }

    //update cart thành order
    cart.status = "PENDING";
    cart.payment_status = "PENDING";
    cart.receiver_name = receiver_name;
    cart.receiver_mobile = receiver_mobile;
    cart.receiver_address = receiver_address;
    cart.total_price = totalPrice;
    cart.delivery_fee = deliveryFee;
    if (voucherId) {
      cart.voucher_id = voucherId;
      //tăng số lượt sử dụng voucher
      try {
        await useVoucher(voucher_code);
      } catch (useVoucherError) {
        console.error(
          "❌ Lỗi khi sử dụng voucher:",
          voucher_code,
          useVoucherError
        );
        // Không block checkout, chỉ log lỗi
      }
    }

    try {
      await cart.save();
    } catch (saveError) {
      console.error("❌ Lỗi khi save cart:", saveError);
      throw new Error("Lỗi khi lưu đơn hàng: " + saveError.message);
    }

    //tạo vnpay transaction ID
    const vnpayOrderId = cart.order_code;

    //lưu transaction id vào order
    cart.vnpay_transaction_id = vnpayOrderId;
    try {
      await cart.save();
    } catch (saveError) {
      console.error("❌ Lỗi khi save vnpay_transaction_id:", saveError);
      throw new Error("Lỗi khi lưu transaction ID: " + saveError.message);
    }

    //tạo payment url
    // Lấy IP từ request (từ header X-Forwarded-For nếu có proxy, hoặc req.ip)
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.headers["x-real-ip"] ||
      req.ip ||
      req.connection.remoteAddress ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    console.log("💰 Creating payment URL for order:", vnpayOrderId);
    console.log("- Final amount:", finalAmount);
    console.log("- Client IP:", clientIp);

    let paymentUrl;
    try {
      paymentUrl = buildPayment(finalAmount, vnpayOrderId, clientIp);
      if (!paymentUrl) {
        throw new Error("buildPayment trả về null/undefined");
      }
      console.log(
        "✅ Payment URL created:",
        paymentUrl.substring(0, 100) + "..."
      );
    } catch (buildPaymentError) {
      console.error("❌ Lỗi khi build payment URL:", buildPaymentError);
      console.error("Error stack:", buildPaymentError.stack);
      throw new Error("Lỗi khi tạo payment URL: " + buildPaymentError.message);
    }

    return res.status(200).json({
      success: true,
      orderId: cart._id,
      orderCode: cart.order_code,
      paymentUrl: paymentUrl,
      amount: finalAmount,
    });
  } catch (error) {
    console.error("❌ ========== LỖI CHECKOUT ==========");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    if (error.response) {
      console.error("Error response:", error.response);
    }
    console.error("=====================================");

    return res.status(500).json({
      message: "Lỗi server khi xử lý thanh toán",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
