import express from 'express';
import cors from 'cors';
import productRoutes from './routes/product.routes.js';

const app = express();

app.use(cors({
    origin:"http://localhost:4200", //connect với frontend
    method: ["GET", "POST", "DELETE"],
    credentials: true // gửi cookie, token, jwt để xác thực
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.send("backend + mongodb đang chạy", productRoutes);
})

export default app;