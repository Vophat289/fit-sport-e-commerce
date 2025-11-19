import { 
  getAvailableVouchers, 
  validateVoucher, 
  useVoucher as useVoucherService 
} from "../services/voucher.service.js";

// Lấy danh sách voucher khả dụng
export const getAvailable = async (req, res) => {
  try {
    const vouchers = await getAvailableVouchers();
    res.json({ success: true, vouchers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Kiểm tra voucher
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

// Tăng used_count khi thanh toán
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
