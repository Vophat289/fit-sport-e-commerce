import Voucher from "../models/voucher.model.js";

// Lấy voucher đang còn hiệu lực và chưa vượt giới hạn sử dụng
export const getAvailableVouchers = async () => {
  const now = new Date();

  return await Voucher.find({
    start_date: { $lte: now },
    end_date: { $gte: now },
    $expr: { $lt: ["$used_count", "$usage_limit"] }, // used_count < usage_limit
  }).lean();
};

// Kiểm tra tính hợp lệ của voucher với tổng tiền đơn hàng
export const validateVoucher = async (code, orderTotal) => {
  const now = new Date();

  const voucher = await Voucher.findOne({
    code,
    start_date: { $lte: now },
    end_date: { $gte: now },
  });

  if (!voucher) return { valid: false, message: "Mã voucher không tồn tại hoặc đã hết hạn." };

  if (voucher.usage_limit > 0 && voucher.used_count >= voucher.usage_limit) {
    return { valid: false, message: "Voucher đã sử dụng hết lượt." };
  }

  if (orderTotal < voucher.min_order_value) {
    return { valid: false, message: `Đơn hàng phải tối thiểu ${voucher.min_order_value}đ.` };
  }

  // Tính số tiền giảm
  let discount = 0;

  if (voucher.type === "percent") {
    discount = (orderTotal * voucher.value) / 100;
  } else {
    discount = voucher.value;
  }

  const newTotal = orderTotal - discount;

  return {
    valid: true,
    voucher,
    discount,
    newTotal: newTotal < 0 ? 0 : newTotal,
  };
};

// Tăng số lượt đã sử dụng của voucher
export const useVoucher = async (code) => {
  return await Voucher.findOneAndUpdate(
    { code },
    { $inc: { used_count: 1 } },
    { new: true }
  );
};
