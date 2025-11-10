    import User from '../models/user.model.js';
    import jwt from 'jsonwebtoken';
    import dotenv from 'dotenv';
    import { sendEmail } from '../services/emailService.js'; 
    import EmailValidator from 'email-deep-validator';

    dotenv.config();
    const emailValidator = new EmailValidator();

    const generateToken = (user) => {
        return jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_secret_key', 
            { expiresIn: '1d' }
        );
    };

    // đăng ký
   export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        //  kiểm tra mail có tồn tại hay không
        const { wellFormed, validDomain, validMailbox } = await emailValidator.verify(email);

        if (!wellFormed) {
            return res.status(400).json({ message: 'Email không đúng định dạng. Vui lòng kiểm tra lại.' });
        }
        
        if (!validDomain) {
            return res.status(400).json({ message: 'Tên miền của email không tồn tại. Vui lòng sử dụng địa chỉ email hợp lệ.' });
        }
        
        // kiểm tra sự tồn tại của hộp thư
        if (!validMailbox) {
             return res.status(400).json({ message: 'Hộp thư email này không tồn tại hoặc không thể nhận thư. Vui lòng kiểm tra email.' });
        }

        // kiểm tra User đã tồn tại
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // kiểm tra trạng thái xác minh và xử lý
            if (!existingUser.isVerified) {
                // gửi lại PIN nếu PIN cũ đã hết hạn (chưa xử lý logic gửi lại ở đây, chỉ thông báo)
                return res.status(202).json({ 
                    message: 'Email đã đăng ký nhưng chưa xác minh. Vui lòng kiểm tra hộp thư và nhập Mã PIN.' 
                });
            }
            return res.status(400).json({ message: 'Email đã được đăng ký và xác minh.' });
        }

        // tạo người dùng mới
        const newUser = new User({ name, email, password });
        
        // tạo mã pin xác minh
        const verificationPin = newUser.createVerificationPin(); 
        await newUser.save({ validateBeforeSave: false }); // lưu user với pin
        
        // gửi email xác minh
        await sendEmail({
            email: newUser.email,
            subject: 'Mã PIN Xác minh Email Fit Sport E-commerce',
            message: `
                <h1>Xác minh tài khoản</h1>
                <p>Mã PIN xác minh email của bạn là:</p>
                <h2 style="color: #007bff; text-align: center;">${verificationPin}</h2>
                <p>Vui lòng nhập mã này vào trang xác minh để hoàn tất đăng ký. Mã sẽ hết hạn sau 15 phút.</p>
            `
        });

        return res.status(201).json({ 
            message: 'Đăng ký thành công! Vui lòng kiểm tra email để nhận Mã PIN xác minh.',
            email: newUser.email // trả về email để fe biết tài khoản nào cần xác minh
        });

    } catch (error) {
        console.error("Lỗi đăng ký:", error.message);
        return res.status(500).json({ message: 'Lỗi server khi đăng ký.' });
    }
};

    // xác minh mã pin
    export const verifyPin = async (req, res) => {
        try {
            // nhận email và pin từ body (fe gửi)
            const { email, pin } = req.body; 

            // tìm người dùng bằng email, pin và kiểm tra thời gian hết hạn
            const user = await User.findOne({
                email,
                verificationPin: pin, // so sánh trực tiếp pin
                verificationPinExpires: { $gt: Date.now() } 
            });

            if (!user) {
                return res.status(400).json({ message: 'Mã PIN không đúng, đã hết hạn hoặc email không tồn tại.' });
            }

            // xác minh thành công
            user.isVerified = true;
            user.verificationPin = undefined; // xóa pin
            user.verificationPinExpires = undefined; // xóa thời gian hết hạn
            await user.save({ validateBeforeSave: false });

            // đăng nhập tự động sau khi xác minh
            const token = generateToken(user);
            user.password = undefined;

            return res.status(200).json({ 
                message: 'Xác minh email thành công. Đăng nhập tự động.', 
                token,
                user
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server khi xác minh PIN.' });
        }
    };

    // đăng nhập
    export const login = async (req, res) => {
        try {
            const { email, password } = req.body;
            
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
            }

            // kiểm tra trạng thái xác minh
            if (!user.isVerified) {
                return res.status(401).json({ message: 'Vui lòng xác minh email của bạn trước khi đăng nhập.' });
            }
            
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
            }
            
            const token = generateToken(user);
            user.password = undefined; 

            return res.status(200).json({ 
                message: 'Đăng nhập thành công', 
                token,
                user
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
        }
    };