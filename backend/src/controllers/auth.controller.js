import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { sendEmail } from '../services/emailService.js';
import EmailValidator from 'email-deep-validator';

dotenv.config();
const emailValidator = new EmailValidator();

// tạo jwt token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'your_secret_key',
    { expiresIn: '1d' }
  );
};

// đăng nhập
export const login = async (req, res) => {
  try {
    const { name, password } = req.body; 

    // tìm user theo name
    const user = await User.findOne({ name }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    // kiểm tra xác minh email 
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Vui lòng xác minh tài khoản trước khi đăng nhập.' });
    }

    // so sánh mật khẩu
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }
    const token = generateToken(user);

    // loại bỏ password khỏi kết quả trả về
    const { password: _, ...safeUser } = user.toObject();

    return res.status(200).json({
      message: 'Đăng nhập thành công.',
      token,
      user: safeUser,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
  }
};

// đăng ký 
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // kiểm tra email hợp lệ
    const { wellFormed, validDomain, validMailbox } = await emailValidator.verify(email);
    if (!wellFormed) return res.status(400).json({ message: 'Email không đúng định dạng.' });
    if (!validDomain) return res.status(400).json({ message: 'Tên miền email không tồn tại.' });
    if (!validMailbox) return res.status(400).json({ message: 'Hộp thư email không tồn tại.' });

    // kiểm tra user đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.isVerified) {
        // gửi lại mã PIN
        const newPin = existingUser.createVerificationPin();
        await existingUser.save({ validateBeforeSave: false });

        await sendEmail({
          email: existingUser.email,
          subject: 'Mã PIN xác minh mới - Fit Sport',
          message: `
            <h1>Xác minh tài khoản</h1>
            <p>Mã PIN xác minh mới của bạn là:</p>
            <h2 style="color:#007bff;text-align:center;">${newPin}</h2>
            <p>Mã này sẽ hết hạn sau 15 phút.</p>
          `
        });
        return res.status(200).json({ message: 'Mã PIN mới đã được gửi lại qua email.' });
      }
      return res.status(400).json({ message: 'Email đã được đăng ký và xác minh.' });
    }

    // tạo user mới
    const newUser = new User({ name, email, password });
    const verificationPin = newUser.createVerificationPin();
    await newUser.save({ validateBeforeSave: false });

    await sendEmail({
      email: newUser.email,
      subject: 'Mã PIN Xác minh Email Fit Sport',
      message: `
        <h1>Xác minh tài khoản</h1>
        <p>Mã PIN xác minh email của bạn là:</p>
        <h2 style="color:#007bff;text-align:center;">${verificationPin}</h2>
        <p>Vui lòng nhập mã này trong 15 phút để hoàn tất đăng ký.</p>
      `
    });

    return res.status(201).json({
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để nhận Mã PIN xác minh.',
      email: newUser.email
    });

  } catch (error) {
    console.error("Lỗi đăng ký:", error.message);
    return res.status(500).json({ message: 'Lỗi server khi đăng ký.' });
  }
};

// Xác minh mã PIN khi đăng ký
export const verifyPin = async (req, res) => {
  try {
    const { email, pin } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: 'Không tìm thấy người dùng với email này.' });

    if (user.verificationPin !== pin)
      return res.status(400).json({ message: 'Mã PIN không chính xác.' });

    if (user.verificationPinExpires < Date.now())
      return res.status(400).json({ message: 'Mã PIN đã hết hạn.' });

    // Cập nhật trạng thái xác minh
    user.isVerified = true;
    user.verificationPin = undefined;
    user.verificationPinExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Xác minh tài khoản thành công. Bạn có thể đăng nhập ngay.' });
  } catch (error) {
    console.error('Lỗi verifyPin:', error.message);
    res.status(500).json({ message: 'Lỗi server khi xác minh mã PIN.' });
  }
};


// quên mật khẩu 
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng với email này.' });

    // Tạo mã PIN 6 số
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPin = pin;
    user.resetPinExpires = Date.now() + 10 * 60 * 1000; 
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      email: user.email,
      subject: 'Mã PIN đặt lại mật khẩu - Fit Sport',
      message: `
        <h1>Đặt lại mật khẩu</h1>
        <p>Mã PIN để đặt lại mật khẩu của bạn là:</p>
        <h2 style="color:#007bff;text-align:center;">${pin}</h2>
        <p>Mã này sẽ hết hạn sau 10 phút.</p>
      `
    });

    res.status(200).json({ message: 'Mã PIN đặt lại mật khẩu đã được gửi qua email.' });
  } catch (error) {
    console.error('Lỗi forgotPassword:', error.message);
    res.status(500).json({ message: 'Lỗi server khi gửi mã PIN.' });
  }
};

// xác minh mã PIN đặt lại mật khẩu
export const verifyResetPin = async (req, res) => {
  try {
    const { email, pin } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

    if (user.resetPin.toString() !== pin.toString())
      return res.status(400).json({ message: 'Mã PIN không chính xác.' });

    if (user.resetPinExpires < Date.now())
      return res.status(400).json({ message: 'Mã PIN đã hết hạn.' });

    res.status(200).json({ message: 'Mã PIN hợp lệ, bạn có thể đặt lại mật khẩu.' });
  } catch (error) {
    console.error('Lỗi verifyResetPin:', error.message);
    res.status(500).json({ message: 'Lỗi server khi xác minh mã PIN.' });
  }
};

// đặt lại mật khẩu
export const resetPassword = async (req, res) => {
  try {
    const { pin, newPassword } = req.body;

    // tìm user theo mã PIN
    const user = await User.findOne({ resetPin: pin });

    if (!user)
      return res.status(404).json({ message: 'Không tìm thấy người dùng với mã PIN này.' });

    if (user.resetPinExpires < Date.now())
      return res.status(400).json({ message: 'Mã PIN đã hết hạn.' });

    // cập nhật mật khẩu mới
    user.password = newPassword;
    user.resetPin = undefined;
    user.resetPinExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công.' });
  } catch (error) {
    console.error('Lỗi resetPassword:', error.message);
    res.status(500).json({ message: 'Lỗi server khi đặt lại mật khẩu.' });
  }
};


// đăng xuất
export const logout = async (req, res) => {
  try {
    return res.status(200).json({ message: 'Đăng xuất thành công.' });
  } catch (error) {
    console.error('Lỗi logout:', error.message);
    return res.status(500).json({ message: 'Lỗi server khi đăng xuất.' });
  }
};
