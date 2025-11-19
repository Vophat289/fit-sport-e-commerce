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
 * @returns {string} - JWT token
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
// 1. ĐĂNG NHẬP (LOGIN)
export const login = async (req, res) => {
    try {
        const { name, password } = req.body; 
        // 1. Tìm user theo name
        const user = await User.findOne({ name }).select('+password');
        if (!user) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
        }
        // 2. Kiểm tra xác minh email
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Vui lòng xác minh tài khoản trước khi đăng nhập.' });
        }
        // 3. So sánh mật khẩu
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
        }      
        // 4. Tạo token và trả về
        const token = generateToken(user);
        // Loại bỏ password khỏi kết quả trả về
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

// =======================================================
// 2. ĐĂNG KÝ (REGISTER)
// =======================================================

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Kiểm tra tính hợp lệ của email
        const { wellFormed, validDomain, validMailbox } = await emailValidator.verify(email);
        if (!wellFormed) return res.status(400).json({ message: 'Email không đúng định dạng.' });
        if (!validDomain) return res.status(400).json({ message: 'Tên miền email không tồn tại.' });
        // if (!validMailbox) return res.status(400).json({ message: 'Hộp thư email không tồn tại.' });

        // 2. Kiểm tra user đã tồn tại
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            if (!existingUser.isVerified) {
                // Gửi lại mã PIN nếu chưa xác minh
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

        // 3. Tạo user mới và gửi mã PIN
        const newUser = new User({ name, email, password });
        const verificationPin = newUser.createVerificationPin();
        await newUser.save(); // Lưu user (password sẽ được hash trong pre-save hook)

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
        // Xử lý lỗi trùng lặp (nếu 'name' cũng là unique) hoặc lỗi schema
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã tồn tại.' });
        }
        console.error("Lỗi đăng ký:", error.message);
        return res.status(500).json({ message: 'Lỗi server khi đăng ký.' });
    }
};

// =======================================================
// 3. XÁC MINH (VERIFY PIN)
// =======================================================

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

// =======================================================
// 4. QUÊN MẬT KHẨU (FORGOT PASSWORD)
// =======================================================

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng với email này.' });

        // Tạo mã PIN 6 số
        const pin = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetPin = pin;
        user.resetPinExpires = Date.now() + 10 * 60 * 1000; // Hết hạn sau 10 phút
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

// =======================================================
// 5. XÁC MINH PIN ĐẶT LẠI MẬT KHẨU (VERIFY RESET PIN)
// =======================================================

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

// =======================================================
// 6. ĐẶT LẠI MẬT KHẨU (RESET PASSWORD)
// =======================================================

export const resetPassword = async (req, res) => {
    try {
        const { pin, newPassword } = req.body;

        // Tìm user theo mã PIN
        const user = await User.findOne({ resetPin: pin });

        if (!user)
            return res.status(404).json({ message: 'Không tìm thấy người dùng với mã PIN này.' });

        if (user.resetPinExpires < Date.now())
            return res.status(400).json({ message: 'Mã PIN đã hết hạn.' });

        // Cập nhật mật khẩu mới
        user.password = newPassword; // Sẽ được hash tự động trong pre-save hook của Mongoose
        user.resetPin = undefined;
        user.resetPinExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Đặt lại mật khẩu thành công.' });
    } catch (error) {
        console.error('Lỗi resetPassword:', error.message);
        res.status(500).json({ message: 'Lỗi server khi đặt lại mật khẩu.' });
    }
};

// =======================================================
// 7. ĐĂNG XUẤT (LOGOUT)
// =======================================================

export const logout = (req, res) => {
    // Lưu ý: Nếu bạn chỉ dùng JWT (stateless), hàm logout này chỉ cần xóa token trên client.
    // Vì code của bạn có vẻ đang sử dụng session (req.logout, req.session.destroy), 
    // tôi giữ nguyên logic này nhưng nó thường không cần thiết khi dùng JWT
    
    // Nếu sử dụng Passport.js và Session:
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
                    res.clearCookie('connect.sid'); // Xóa cookie session trên client
                    return res.status(200).json({ message: 'Đăng xuất thành công.' });
                });
            } else {
                return res.status(200).json({ message: 'Đăng xuất thành công.' });
            }
        });
    } else {
        // Chỉ đơn giản là thông báo thành công nếu không dùng session/passport
        return res.status(200).json({ message: 'Đăng xuất thành công. Token cần được xóa khỏi client.' });
    }
};