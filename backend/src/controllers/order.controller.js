import Oders from '../models/oders.model.js';
import OdersDetails from '../models/odersDetails.model.js';
import { normalizeImages } from '../config/cloudinary.js';

const STATUS_LABELS = {
  PENDING: 'Chờ Xác Nhận',
  PROCESSING: 'Đang Chuẩn Bị Hàng',
  SHIPPED: 'Đang Vận Chuyển',
  DELIVERED: 'Đã Hoàn Thành',
  CANCELLED: 'Đã Hủy',
  CART: 'Giỏ hàng'
};

// -------------------------- GET ALL ORDERS --------------------------
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = { status: { $ne: 'CART' } };

    if (search) {
      query.$or = [
        { order_code: { $regex: search, $options: 'i' } },
        { 'user_id.username': { $regex: search, $options: 'i' } },
        { receiver_phone: { $regex: search, $options: 'i' } },
        { receiver_name: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Oders.countDocuments(query);

    const orders = await Oders.find(query)
      .populate('user_id', 'username phone email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const mappedOrders = orders.map(o => ({
      ...o,
      id: o.order_code,
      customer: o.receiver_name?.trim() || o.user_id?.username || o.user_id?.email || 'Khách lẻ',
      phone: o.receiver_phone?.trim() || o.user_id?.phone || '—',
      address: o.receiver_address || '—',
      total: (o.total_price || 0) + (o.delivery_fee || 0),
      paid: o.payment_status === 'PAID',
      status: o.status,
      date: o.createdAt,
    }));

    res.json({
      success: true,
      data: mappedOrders,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------- GET ONE ORDER --------------------------
export const getOrderById = async (req, res) => {
  try {
    const order = await Oders.findById(req.params.id)
      .populate('user_id', 'username phone email')
      .lean();

    if (!order)
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });

    let details = await OdersDetails.find({ order_id: order._id })
      .populate('variant_id', 'product_name image')
      .lean();

    const mappedDetails = details.map(d => {
      // Ưu tiên lấy ảnh từ snapshot (productImage)
      let productImages = normalizeImages(d.productImage);

      // Nếu không có snapshot, lấy từ variant
      if (productImages.length === 0 && d.variant_id?.image) {
        productImages = normalizeImages(d.variant_id.image);
      }

      return {
        id: d._id,
        productName: d.productName || d.variant_id?.product_name || 'Sản phẩm không rõ',
        image: productImages.length > 0 ? productImages[0] : 'assets/images/default-product.png',
        price: d.price,
        quantity: d.quantity
      };
    });



    const customerName =
      order.receiver_name?.trim() ||
      order.user_id?.username ||
      order.user_id?.email ||
      'Khách lẻ';

    const phone =
      order.receiver_phone?.trim() ||
      order.user_id?.phone ||
      '—';

    res.json({
      success: true,
      data: {
        ...order,
        customer: customerName,
        phone,
        total_price: (order.total_price || 0) + (order.delivery_fee || 0),
        items: mappedDetails
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------- CREATE ORDER --------------------------
export const createOrder = async (req, res) => {
  try {
    const newOrder = new Oders(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json({ success: true, data: savedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------- UPDATE ORDER STATUS --------------------------
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const updatedOrder = await Oders.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedOrder)
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------- DELETE ORDER --------------------------
export const deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Oders.findByIdAndDelete(req.params.id);
    if (!deletedOrder)
      return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });

    res.json({ success: true, message: 'Xóa đơn hàng thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
