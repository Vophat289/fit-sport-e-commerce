// backend/controllers/contact.controller.js

import Contact from '../models/contact.model.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ quiet: true });

// POST: Gửi liên hệ + lưu DB + gửi mail
export const sendContactMail = async (req, res) => {
  try {
    const { fullName, email, phone, content } = req.body;

    // 1️⃣ Lưu vào MongoDB
    await Contact.create({ fullName, email, phone, content });

    // 2️⃣ Tạo transporter Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 3️⃣ Mail đến admin
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
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
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
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

    res.status(200).json({ message: 'Gửi mail thành công và auto-reply đã được gửi' });

  } catch (err) {
    console.error('Lỗi gửi mail:', err);
    res.status(500).json({ message: 'Gửi mail thất bại', error: err });
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
