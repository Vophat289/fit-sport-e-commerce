import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Contact from '../models/contact.model.js';

dotenv.config();

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

    // 3️⃣ Mail đến admin (ở đây là danhvipff@gmail.com)
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
