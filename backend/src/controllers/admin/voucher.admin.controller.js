import Voucher from "../../models/voucher.model.js";

// GET danh sách voucher (  search + phân trang)
export const getAllVouchers = async (req, res) => {
  try {
    const { page = 1, limit = 5, search = "" } = req.query;

    const query = {
      code: { $regex: search, $options: "i" }
    };

    const total = await Voucher.countDocuments(query);

    const vouchers = await Voucher.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ end_date: -1, _id: 1 });

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      vouchers
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET voucher theo code
export const getVoucherByCode = async (req, res) => {
  try {
    const { code } = req.params;  // lấy code từ params URL

    const voucher = await Voucher.findOne({ code });

    if (!voucher) {
      return res.status(404).json({ error: "Voucher không tồn tại" });
    }

    res.json(voucher);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// POST tạo voucher mới
export const createVoucher = async (req, res) => {
  try {
    let {
      code,
      value,
      type,
      min_order_value,
      start_date,
      end_date,
      usage_limit
    } = req.body;

    // Validate cơ bản
    if (!code || !value || !type || !start_date || !end_date) {
      return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc" });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ error: "start_date phải nhỏ hơn end_date" });
    }

    const exist = await Voucher.findOne({ code });
    if (exist) {
      return res.status(400).json({ error: "Mã voucher đã tồn tại" });
    }

    const voucher = await Voucher.create({
      code,
      value,
      type,
      min_order_value,
      start_date,
      end_date,
      usage_limit
    });

    res.status(201).json(voucher);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// PUT cập nhật voucher
export const updateVoucher = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: Date.now()
    };

    if (updateData.start_date && updateData.end_date) {
      if (new Date(updateData.start_date) >= new Date(updateData.end_date)) {
        return res.status(400).json({ error: "start_date phải nhỏ hơn end_date" });
      }
    }

    const voucher = await Voucher.findOneAndUpdate(
      { code: req.params.code },
      updateData,
      { new: true }
    );

    if (!voucher) {
      return res.status(404).json({ error: "Voucher không tồn tại" });
    }

    res.json(voucher);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// DELETE voucher
export const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findOneAndDelete(req.params.code);

    if (!voucher) {
      return res.status(404).json({ error: "Voucher không tồn tại" });
    }

    res.json({ message: "Xóa thành công" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
