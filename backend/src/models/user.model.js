import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    // cập nhật mã pin/otp 
    isVerified: { 
        type: Boolean,
        default: false,
    },
    verificationPin: String, // lưu mã pin 6 số
    verificationPinExpires: Date, // thời gian hết hạn
}, { timestamps: true });

// tự động mã hóa mật khẩu trước khi lưu 
UserSchema.pre('save', async function (next) { 
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 10);
    }
    next();
});

// tạo mã pin xác minh
UserSchema.methods.createVerificationPin = function() {
    // tạo mã pin 6 chữ số
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    // lưu pin trực tiếp vào database
    this.verificationPin = pin; 

    // hết hạn sau 15 phút 
    this.verificationPinExpires = Date.now() + 15 * 60 * 1000;

    // trả về pin để gửi đi trong email
    return pin; 
};

// so sánh mật khẩu lúc đăng nhập 
UserSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
};

const User = mongoose.model('User', UserSchema);

export default User;