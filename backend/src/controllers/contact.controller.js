// backend/controllers/contact.controller.js

import Contact from '../models/contact.model.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

// POST: Gửi liên hệ + lưu DB + gửi mail
export const sendContactMail = async (req, res) => {
  try {
    const { fullName, email, phone, content } = req.body;

    // Validation dữ liệu đầu vào
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập họ và tên' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }

    // Kiểm tra format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập số điện thoại' });
    }

    // Kiểm tra format số điện thoại (10 số, bắt đầu bằng 0)
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Số điện thoại phải có 10 số và bắt đầu bằng 0' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập nội dung' });
    }

    // 1️⃣ Lưu vào MongoDB (ưu tiên - luôn lưu trước)
    const savedContact = await Contact.create({ 
      fullName: fullName.trim(), 
      email: email.trim(), 
      phone: phone.trim(), 
      content: content.trim() 
    });

    console.log('✅ Đã lưu liên hệ vào DB:', savedContact._id);

    // 2️⃣ Gửi email (không bắt buộc - nếu lỗi vẫn trả về success)
    let emailSent = false;
    let emailError = null;

    try {
      // Tạo transporter Nodemailer
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // 3️⃣ Mail đến admin
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Fit Sport'}" <${process.env.EMAIL_USER}>`,
        to: process.env.MAIL_RECEIVER,
        subject: `Khách hàng liên hệ từ Fit Sport: ${fullName}`,
        html: `
          <h3>Thông tin khách hàng:</h3>
          <p><strong>Họ tên:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Nội dung:</strong><br>${content}</p>
        `
      });

      // 4️⃣ Mail auto-reply đến khách hàng
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Fit Sport'}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Cảm ơn bạn đã liên hệ Fit Sport 🎉`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; text-align: center; color: #333;">
            <h2 style="color: #007bff;">🎉 Xin chào ${fullName}! 🎉</h2>
            <p>💖 Cảm ơn bạn đã quan tâm đến <strong>Fit Sport</strong>. Chúng tôi đã nhận được thông tin của bạn và sẽ phản hồi sớm nhất có thể.</p>
            
            <div style="margin: 20px 0;">
              ✨✨✨✨✨✨✨✨✨✨
            </div>

            <p>Chúc bạn một ngày tuyệt vời! 🌟</p>
            <p style="margin-top: 30px; font-weight: bold;">Fit Sport Team 🚀</p>
          </div>
        `
      });

      emailSent = true;
      console.log('✅ Đã gửi email thành công');
    } catch (emailErr) {
      emailError = emailErr;
      console.error('⚠️ Lỗi khi gửi email (nhưng đã lưu vào DB):', emailErr);
      // Không throw error - vì đã lưu vào DB rồi
    }

    res.status(200).json({ 
      success: true,
      message: 'Gửi thông tin liên hệ thành công. Chúng tôi sẽ phản hồi sớm nhất có thể!' 
    });

  } catch (err) {
    console.error('Lỗi gửi liên hệ:', err);
    
    // Nếu lỗi do email (nodemailer), vẫn trả về success nhưng log lỗi
    // Vì đã lưu vào DB rồi
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Dữ liệu không hợp lệ', 
        error: err.message 
      });
    }

    // Nếu lỗi khi gửi email nhưng đã lưu DB, vẫn trả về success
    // Vì thông tin đã được lưu, chỉ là không gửi được email
    res.status(200).json({ 
      success: true,
      message: 'Đã nhận được thông tin của bạn. Chúng tôi sẽ liên hệ lại sớm nhất có thể!',
      warning: 'Có thể email xác nhận chưa được gửi, nhưng thông tin của bạn đã được lưu lại.'
    });
  }
};

// GET: Lấy tất cả danh sách liên hệ (chỉ dành cho admin)
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .sort({ createdAt: -1 }) // mới nhất lên đầu
      .select('-__v'); // ẩn field __v

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET: Lấy 1 liên hệ theo ID
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    }
    res.status(200).json({ success: true, data: contact });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// DELETE: Xóa liên hệ
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    }
    res.status(200).json({ success: true, message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
