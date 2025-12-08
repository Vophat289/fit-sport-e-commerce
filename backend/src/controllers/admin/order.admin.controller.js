import Oders from '../../models/oders.model.js';
import OdersDetails from '../../models/odersDetails.model.js';

// Chỉ 4 trạng thái
const STATUS_LABELS = {
  NEW: 'Chờ Xác Nhận',
  PROCESSING: 'Đang Chuẩn Bị Hàng',
  SHIPPED: 'Đang Vận Chuyển',
  DELIVERED: 'Đã Hoàn Thành',
};

// Lấy danh sách đơn hàng (có tìm kiếm & phân trang)
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = {
      $or: [
        { order_code: { $regex: search, $options: 'i' } },
      ],
    };

    if (search) {
      query.$or.push({ 'user_id.username': { $regex: search, $options: 'i' } });
      query.$or.push({ 'user_id.phone': { $regex: search, $options: 'i' } });
    }

    const total = await Oders.countDocuments(query);
    const orders = await Oders.find(query)
      .populate('user_id', 'username phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const mappedOrders = orders.map(o => ({
      ...o._doc,
      status_label: STATUS_LABELS[o.status] || o.status,
      user_name: o.user_id?.username || '—',
      user_phone: o.user_id?.phone || '—',
    }));

    res.json({ success: true, data: mappedOrders, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xem chi tiết đơn hàng
export const getOrderById = async (req, res) => {
  try {
    const order = await Oders.findById(req.params.id)
      .populate('user_id', 'username phone');

    if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });

    const details = await OdersDetails.find({ order_id: order._id })
      .populate('variant_id', 'name price')
      .lean();

    res.json({ 
      success: true, 
      data: { 
        ...order._doc, 
        status_label: STATUS_LABELS[order.status] || order.status,
        user_name: order.user_id?.username || '—',
        user_phone: order.user_id?.phone || '—',
        details 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo đơn hàng
export const createOrder = async (req, res) => {
  try {
    const newOrder = new Oders(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json({ success: true, data: savedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật đơn hàng
export const updateOrder = async (req, res) => {
  try {
    // Validate trạng thái nếu có
    if (req.body.status && !['NEW','PROCESSING','SHIPPED','DELIVERED'].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const updatedOrder = await Oders.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedOrder) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa đơn hàng
export const deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Oders.findByIdAndDelete(req.params.id);
    if (!deletedOrder) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    res.json({ success: true, message: 'Xóa đơn hàng thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
