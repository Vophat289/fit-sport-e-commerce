import Contact from "../../models/contact.model.js";

// Lấy danh sách contact
export const getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const total = await Contact.countDocuments(query);

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      message: "Lấy danh sách liên hệ thành công",
      data: contacts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách liên hệ",
    });
  }
};

// Xóa liên hệ
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const removed = await Contact.findByIdAndDelete(id);

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: "Liên hệ không tồn tại",
      });
    }

    return res.json({
      success: true,
      message: "Xóa liên hệ thành công",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa liên hệ",
    });
  }
};
