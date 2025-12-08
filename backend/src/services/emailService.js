import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

// Cấu hình người gửi
const transporter = nodemailer.createTransport({
    service: 'Gmail', 
    auth: {
        user: process.env.EMAIL_USER, // địa chỉ email gửi đi 
        pass: process.env.EMAIL_PASS  // mật khẩu ứng dụng 
    }
});

/**
  // hàm gửi email
  @param {object} options - đối tượng chứa thông tin email
  @param {string} options.email - địa chỉ người nhận
  @param {string} options.subject - chủ đề email
  @param {string} options.message - nội dung email 
 */
export const sendEmail = async (options) => {
    const mailOptions = {
        // tên hiển thị khi gửi lấy từ .env
        from: `"${process.env.EMAIL_FROM_NAME || 'Fit Sport'}" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject, 
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.5;">${options.message}</div>`,   
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email đã gửi thành công tới: ${options.email}. Message ID: ${info.messageId}`);
        return info; 
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
        throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
    }
};