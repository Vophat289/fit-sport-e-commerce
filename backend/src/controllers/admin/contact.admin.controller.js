import Contact from "../../models/contact.model.js";

// Lấy danh sách contact (phân trang + search, hiển thị cả ẩn/hiện)
export const getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    // Query: tìm theo search (fullName, email, phone) nhưng không lọc isVisible
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
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách liên hệ",
    });
  }
};

// Ẩn/Hiện contact
export const toggleContactVisibility = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Liên hệ không tồn tại",
      });
    }

    // Đảo ngược isVisible
    contact.isVisible = !contact.isVisible;
    await contact.save();

    return res.json({
      success: true,
      message: `Liên hệ đã được ${contact.isVisible ? "hiển thị" : "ẩn"}`,
      data: contact,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi thay đổi trạng thái liên hệ",
    });
  }
};
