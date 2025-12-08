import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';
import { setupSocket } from './socket/index.js';

dotenv.config({ quiet: true })

// Xử lý unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ UNHANDLED REJECTION:', err);
    // Không exit ngay, để server tiếp tục chạy nhưng log lỗi
});

// Xử lý uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT EXCEPTION:', err);
    process.exit(1); // Exit vì đây là lỗi nghiêm trọng
});

//kết nối db
connectDB().catch((err) => {
    console.error('❌ Lỗi kết nối database:', err);
    process.exit(1);
});

const PORT = process.env.PORT || 3000;

// Tạo server từ app để có thể dùng cho socket.io sau này
const server = app.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại PORT: ${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Xử lý lỗi khi server không thể start
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} đã được sử dụng. Vui lòng chọn port khác.`);
    } else {
        console.error('❌ Lỗi server:', err);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('⚠️ SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('⚠️ SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
    });
});

// Socket.io setup (nếu cần sau này)
// const io = setupSocket(server);
// global._io = io;