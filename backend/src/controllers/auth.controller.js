import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { sendEmail } from '../services/emailService.js';
import EmailValidator from 'email-deep-validator';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fitsport_2025';

const emailValidator = new EmailValidator();
/**
 * Tạo JSON Web Token (JWT) cho người dùng đã xác thực.
 * @param {object} user
 * @returns {string} 
 */
export const generateToken = (user) => {
    const email = user.email || (user.emails && user.emails[0]?.value) || (user._json && user._json.email);
    const name = user.name?.givenName || user.displayName || 'Unknown';
    const userId = user._id || user.id;

    return jwt.sign(
        { 
            _id: userId,
            role: user.role ?? 'user',
            name,
            email
        },
        JWT_SECRET,
        { expiresIn: '1d' }
    );
};

// lấy danh sách tất cả user
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // bỏ trường password ra khỏi kết quả
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách user', error: error.message });
  }
};

// đăng nhập
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Vui lòng xác minh tài khoản trước khi đăng nhập.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Tài khoản này đã bị chặn, vui lòng liên hệ quản trị viên.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user.toObject();

    return res.status(200).json({
      message: 'Đăng nhập thành công.',
      token,
      user: safeUser,
    });

  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return res.status(500).json({ message: 'Lỗi server khi đăng nhập.', error: error.message });
  }
};

// đăng ký
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // kiểm tra tính hợp lệ của email
        const { wellFormed, validDomain, validMailbox } = await emailValidator.verify(email);
        if (!wellFormed) return res.status(400).json({ message: 'Email không đúng định dạng.' });
        if (!validDomain) return res.status(400).json({ message: 'Tên miền email không tồn tại.' });
        // if (!validMailbox) return res.status(400).json({ message: 'Hộp thư email không tồn tại.' });

        // kiểm tra user đã tồn tại
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            if (!existingUser.isVerified) {
                // gửi lại mã PIN nếu chưa xác minh
                const newPin = existingUser.createVerificationPin();
                await existingUser.save({ validateBeforeSave: false });

                await sendEmail({
                    email: existingUser.email,
                    subject: 'Mã PIN xác minh mới - Fit Sport',
                    message: `<h1>Xác minh tài khoản</h1><p>Mã PIN xác minh mới của bạn là:</p><h2 style="color:#007bff;text-align:center;">${newPin}</h2><p>Mã này sẽ hết hạn sau 15 phút.</p>`
                });
                return res.status(200).json({ message: 'Mã PIN mới đã được gửi lại qua email.' });
            }
            return res.status(400).json({ message: 'Email đã được đăng ký và xác minh.' });
        }

        // tạo user mới và gửi mã PIN
        const newUser = new User({ name, email, password });
        const verificationPin = newUser.createVerificationPin();
        await newUser.save(); // lưu user (password sẽ được hash trong pre-save hook)

        await sendEmail({
            email: newUser.email,
            subject: 'Mã PIN Xác minh Email Fit Sport',
            message: `<h1>Xác minh tài khoản</h1><p>Mã PIN xác minh email của bạn là:</p><h2 style="color:#007bff;text-align:center;">${verificationPin}</h2><p>Vui lòng nhập mã này trong 15 phút để hoàn tất đăng ký.</p>`
        });

        return res.status(201).json({
            message: 'Đăng ký thành công! Vui lòng kiểm tra email để nhận Mã PIN xác minh.',
            email: newUser.email
        });

    } catch (error) {
        // xử lý lỗi trùng lặp (nếu 'name' cũng là unique) hoặc lỗi schema
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã tồn tại.' });
        }
        console.error("Lỗi đăng ký:", error.message);
        return res.status(500).json({ message: 'Lỗi server khi đăng ký.' });
    }
};

//xác minh
export const verifyPin = async (req, res) => {
    try {
        const { email, pin } = req.body; 
        
        const user = await User.findOne({ email });

        if (!user)
            return res.status(404).json({ message: 'Không tìm thấy người dùng với email này.' });

        if (user.verificationPinExpires < Date.now())
            return res.status(400).json({ message: 'Mã PIN đã hết hạn.' });

        if (user.verificationPin !== String(pin))
            return res.status(400).json({ message: 'Mã PIN không chính xác.' });

        // cập nhật trạng thái xác minh
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

        // tạo mã PIN 
        const pin = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPin = pin;
        user.resetPinExpires = Date.now() + 10 * 60 * 1000; // hết hạn sau 10 phút
        await user.save({ validateBeforeSave: false });

        await sendEmail({
            email: user.email,
            subject: 'Mã PIN đặt lại mật khẩu - Fit Sport',
            message: `<h1>Đặt lại mật khẩu</h1><p>Mã PIN để đặt lại mật khẩu của bạn là:</p><h2 style="color:#007bff;text-align:center;">${pin}</h2><p>Mã này sẽ hết hạn sau 10 phút.</p>`
        });

        res.status(200).json({ message: 'Mã PIN đặt lại mật khẩu đã được gửi qua email.' });
    } catch (error) {
        console.error('Lỗi forgotPassword:', error.message);
        res.status(500).json({ message: 'Lỗi server khi gửi mã PIN.' });
    }
};

// xác minh mã pin đặt lại mật khẩu
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

// chặn hoặc bỏ chặn tài khoản user
export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { block } = req.body; // boolean: true => chặn, false => bỏ chặn

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    user.isBlocked = !!block;
    await user.save();

    return res.status(200).json({
      message: block ? 'Tài khoản đã bị chặn' : 'Tài khoản đã được bỏ chặn',
      user,
    });
  } catch (error) {
    console.error('Lỗi blockUser:', error);
    return res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái chặn', error: error.message });
  }
};

// phân quyền user/admin
export const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // 'user' hoặc 'admin'

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    user.role = role;
    await user.save();

    return res.status(200).json({ message: 'Cập nhật phân quyền thành công', user });
  } catch (error) {
    console.error('Lỗi changeUserRole:', error);
    return res.status(500).json({ message: 'Lỗi server khi cập nhật phân quyền', error: error.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error unblocking user', error: error.message });
  }
};

// đăng xuất 
export const logout = (req, res) => {
    if (req.logout) {
        req.logout(function(err) {
            if (err) {
                console.error('Lỗi logout:', err);
                return res.status(500).json({ message: 'Lỗi server khi đăng xuất.' });
            }
            if (req.session) {
                req.session.destroy(err => {
                    if (err) {
                        console.error('Lỗi hủy session:', err);
                        return res.status(500).json({ message: 'Lỗi server khi đăng xuất.' });
                    }
                    res.clearCookie('connect.sid'); 
                    return res.status(200).json({ message: 'Đăng xuất thành công.' });
                });
            } else {
                return res.status(200).json({ message: 'Đăng xuất thành công.' });
            }
        });
    } else {
        return res.status(200).json({ message: 'Đăng xuất thành công. Token cần được xóa khỏi client.' });
    }
};