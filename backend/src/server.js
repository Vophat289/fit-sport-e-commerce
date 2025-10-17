import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

dotenv.config()

//kết nối db
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server đang chạy tại PORT: ${PORT}`);
})