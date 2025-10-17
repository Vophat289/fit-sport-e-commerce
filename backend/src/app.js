import express from 'express';
import cors from 'cors';
import productRoutes from './routes/product.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("backend + mongodb đang chạy", productRoutes);
})

export default app;