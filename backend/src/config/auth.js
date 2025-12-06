import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.serializeUser((user, done) => {
  // lấy ID người dùng từ profile 
  done(null, user.id); 
});

passport.deserializeUser((id, done) => {
  // tìm người dùng trong DB bằng ID
  // trả về ID để tránh lỗi
  done(null, { id: id }); 
});

// cấu hình Google Strategy
const backendUrl = process.env.BACKEND_URL || process.env.BASE_URL || 'https://fitsport.io.vn';
passport.use(new GoogleStrategy({
  clientID: '319531500593-khepuqkj2lkq7987lqut5dj3f95di7pk.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: `${backendUrl}/api/auth/google/callback` 
}, 
async function(accessToken, refreshToken, profile, done) {
  //  tìm kiếm hoặc tạo user trong database 
  //  đăng nhập hoặc tạo user mới dựa trên profile
  console.log("Đăng nhập thành công với Google:", profile.displayName);
  
  // gọi done(null, profile) khi hoàn tất
  done(null, profile);
}));

export default passport;
