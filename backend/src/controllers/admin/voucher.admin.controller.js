import Voucher from "../../models/voucher.model.js";

// GET danh sách voucher (  search + phân trang)
export const getAllVouchers = async (req, res) => {
  try {
    const { page = 1, limit = 5, search = "" } = req.query;

    const query = {
      code: { $regex: search, $options: "i" }
    };

    const total = await Voucher.countDocuments(query);
    const now = new Date();

    const vouchers = await Voucher.aggregate([
      { $match: query },
      {
        $addFields: {
          isExpired: { $lt: ["$end_date", now] }
        }
      },
      {
        $sort: {
          isExpired: 1, // Valid (false/0) first, Expired (true/1) last
          created_at: -1
        }
      },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) }
    ]);

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
    if (!code || value === undefined || !type || !start_date || !end_date) {
      return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc" });
    }

    code = code.trim().toUpperCase();

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
      min_order_value: min_order_value || 0,
      start_date,
      end_date,
      usage_limit: usage_limit || 0
    });

    res.status(201).json(voucher);

  } catch (error) {
    console.error("Create Voucher Error:", error);
    res.status(500).json({ error: error.message });
  }
};


// PUT cập nhật voucher
export const updateVoucher = async (req, res) => {
  try {
    const { code: paramCode } = req.params;
    const updateData = {
      ...req.body,
      updated_at: Date.now()
    };

    if (updateData.code) {
      updateData.code = updateData.code.trim().toUpperCase();
    }

    if (updateData.start_date && updateData.end_date) {
      if (new Date(updateData.start_date) >= new Date(updateData.end_date)) {
        return res.status(400).json({ error: "start_date phải nhỏ hơn end_date" });
      }
    }

    const voucher = await Voucher.findOneAndUpdate(
      { code: paramCode.toUpperCase() },
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
    const voucher = await Voucher.findOneAndDelete({ code: req.params.code });

    if (!voucher) {
      return res.status(404).json({ error: "Voucher không tồn tại" });
    }

    res.json({ message: "Xóa thành công" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
