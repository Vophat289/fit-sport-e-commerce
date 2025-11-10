import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình người gửi
// sử dụng thông tin EMAIL_USER và EMAIL_PASS từ file .env 
const transporter = nodemailer.createTransport({
    service: 'Gmail', // hoặc 'smtp.gmail.com' nếu service không hoạt động 
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
        from: `"${process.env.EMAIL_FROM_NAME || 'Fit Sport E-commerce'}" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject, 
        html: options.message,    
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email đã gửi thành công tới: ${options.email}. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error('Lỗi nghiêm trọng khi gửi email:', error);
        // Tùy chọn: ném lỗi để xử lý trong controller (ví dụ: xóa user vừa tạo nếu không gửi được email)
        // throw new Error('Không thể gửi email xác minh. Vui lòng thử lại sau.');
    }
};