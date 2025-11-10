import express from 'express';
import cors from 'cors';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js'
import authRoutes from './routes/auth.routes.js';
import { EventEmitter } from 'events';

EventEmitter.defaultMaxListeners = 20

const app = express();

app.use(cors({
    origin:"http://localhost:4200", //connect với frontend
    method: ["GET", "POST", "DELETE"],
    credentials: true // gửi cookie, token, jwt để xác thực
}));
app.use(express.json());

app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("backend + mongodb đang chạy", productRoutes);
})

export default app;