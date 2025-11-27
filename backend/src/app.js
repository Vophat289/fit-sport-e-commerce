import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from './config/auth.js';

import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import authRoutes from './routes/auth.routes.js';

import accountRoutes from './routes/account.routes.js'; 
import voucherRoutes from './routes/voucher.routes.js';
import cartRoutes from './routes/cart.routes.js';
import { EventEmitter } from 'events';
import contactRoutes from './routes/contact.routes.js';

import adminVoucherRoutes from './routes/admin/voucher.admin.routes.js';

EventEmitter.defaultMaxListeners = 20;

const app = express();

app.use(cors({
    origin: "http://localhost:4200", // frontend Angular
    methods: ["GET", "POST", "PUT", "DELETE"], // hỗ trợ các method
    credentials: true // gửi cookie/token cho xác thực
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secretkey123', // dùng cho session
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // đổi true nếu dùng HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 ngày
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// User
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/voucher", voucherRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/contact", contactRoutes);

// Admin
app.use("/api/admin/vouchers", adminVoucherRoutes);

app.get("/", (req, res) => {
    res.send("Backend + MongoDB đang chạy!");
});

export default app;
