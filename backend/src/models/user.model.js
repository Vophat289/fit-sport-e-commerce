import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const UserSchema = new mongoose.Schema({
    name: { type: String,
    required: true, 
    trim: true 
},
  email: { type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true 
},
  password: { type: String, 
    required: true, 
    minlength: 6, 
    select: false 
},
  role: { type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
},
  isVerified: { type: Boolean, 
    default: false 
},
  verificationPin: String,
  verificationPinExpires: Date,
  resetPin: String,
  resetPinExpires: Date,
}, 
    { timestamps: true });

// hash password trước khi lưu
UserSchema.pre('save', async function (next) {

  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();

});

// tạo mã PIN xác minh
UserSchema.methods.createVerificationPin = function () {

  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationPin = pin;
  this.verificationPinExpires = Date.now() + 15 * 60 * 1000;

  return pin;
};

// so sánh mật khẩu
UserSchema.methods.comparePassword = async function (candidatePassword) {

  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);

};

// tạo token đặt lại mật khẩu
UserSchema.methods.getResetPasswordToken = function () {

  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;

};

const User = mongoose.model('User', UserSchema);
export default User;
