import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

passport.serializeUser((user, done) => {
  // Lưu user ID vào session
  done(null, user._id || user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // Tìm user trong database
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Cấu hình Google OAuth Strategy
const backendUrl = process.env.BACKEND_URL || process.env.BASE_URL || 'https://fitsport.io.vn';
const cleanUrl = backendUrl.replace(/\/$/, '');

// Validate Google OAuth credentials
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error('\n⚠️  CẢNH BÁO: Google OAuth credentials chưa được cấu hình!');
  console.error('📝 Hãy thêm vào file .env:');
  console.error('   GOOGLE_CLIENT_ID=your-client-id');
  console.error('   GOOGLE_CLIENT_SECRET=your-client-secret\n');
  throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment variables');
}

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${cleanUrl}/api/auth/google/callback`
},
  async function (accessToken, refreshToken, profile, done) {
    try {
      // Lấy email từ Google profile
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

      if (!email) {
        return done(new Error('Không thể lấy email từ Google profile'), null);
      }

      // Tìm user theo googleId hoặc email
      let user = await User.findOne({
        $or: [
          { googleId: profile.id },
          { email: email }
        ]
      });

      if (user) {
        // User đã tồn tại - cập nhật googleId nếu chưa có
        if (!user.googleId) {
          user.googleId = profile.id;
          user.isVerified = true; // Google đã verify email
          await user.save();
        }

        console.log("Đăng nhập thành công với Google:", user.name);
        return done(null, user);
      } else {
        // Tạo user mới từ Google profile
        const newUser = new User({
          name: profile.displayName || profile.name?.givenName || 'User',
          email: email,
          googleId: profile.id,
          // Tạo random password cho user Google (họ sẽ không dùng)
          password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12),
          isVerified: true, // Google đã verify email
          role: 'user'
        });

        await newUser.save();
        console.log("Tạo user mới từ Google:", newUser.name);
        return done(null, newUser);
      }
    } catch (error) {
      console.error('Lỗi trong Google Strategy callback:', error);
      return done(error, null);
    }
  }));

export default passport;
