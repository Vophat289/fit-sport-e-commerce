import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';
import { setupSocket } from './socket/index.js';

dotenv.config()

//kết nối db
connectDB();

const PORT = process.env.PORT || 3000;
// const io = setupSocket(server);

//lưu io vào global để controller gọi
// global._io = io;

app.listen(PORT, () => {
    console.log(`Server đang chạy tại PORT: ${PORT}`);
})