import { 
  getAvailableVouchers, 
  validateVoucher, 
  useVoucher as useVoucherService 
} from "../services/voucher.service.js";
import Voucher from "../models/voucher.model.js";

// lấy danh sách voucher khả dụng
export const getAvailable = async (req, res) => {
  try {
    const vouchers = await getAvailableVouchers();
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// kiểm tra voucher
export const validate = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;

    const result = await validateVoucher(code, orderTotal);

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// tăng used_count khi thanh toán
export const useVoucher = async (req, res) => {
  try {
    const { code } = req.body;

    const voucher = await useVoucherService(code);

    if (!voucher) {
      return res.status(400).json({ success: false, message: "Voucher không tồn tại." });
    }

    res.json({ success: true, voucher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const applyVoucher = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.json({ success: false, type: "error", message: "Vui lòng nhập mã voucher" });
    }

    const voucher = await Voucher.findOne({ code: code.trim().toUpperCase() });

    if (!voucher) {
      return res.json({ success: false, type: "invalid", message: "Voucher không tồn tại" });
    }

    const now = new Date();

    if (now < voucher.start_date || now > voucher.end_date) {
      return res.json({ success: false, type: "condition", message: "Voucher chưa đến hạn hoặc đã hết hạn" });
    }

    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return res.json({ success: false, type: "condition", message: "Voucher đã hết lượt sử dụng" });
    }

    if (subtotal < voucher.min_order_value) {
      return res.json({
        success: false,
        type: "condition",
        message: `Đơn hàng tối thiểu là ${voucher.min_order_value} để dùng voucher này`,
      });
    }

    // tính giảm giá
    let discount = 0;
    if (voucher.type === "percent") discount = Math.round((subtotal * voucher.value) / 100);
    else if (voucher.type === "fixed") discount = voucher.value;

    res.json({
      success: true,
      type: "success",
      code: voucher.code,
      discount,
      voucherType: voucher.type,
    });
  } catch (error) {
    res.status(500).json({ success: false, type: "error", message: "Lỗi khi áp dụng voucher", error: error.message });
  }
};

// Thu thập voucher
export const collectVoucher = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;

    const voucher = await Voucher.findOne({ code: code.trim().toUpperCase() });

    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher không tồn tại" });
    }

    // Kiểm tra xem user đã thu thập chưa
    if (voucher.collectedBy.includes(userId)) {
      return res.status(400).json({ success: false, message: "Bạn đã thu thập voucher này rồi" });
    }

    // Kiểm tra giới hạn sử dụng
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return res.status(400).json({ success: false, message: "Voucher đã hết lượt sử dụng" });
    }

    // Cập nhật voucher
    voucher.collectedBy.push(userId);
    voucher.used_count += 1;
    await voucher.save();

    res.json({ success: true, message: "Thu thập voucher thành công", voucher });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi thu thập voucher", error: error.message });
  }
};
