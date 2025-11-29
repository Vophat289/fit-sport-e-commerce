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
import contactRoutes from './routes/contact.routes.js';
import newsRoutes from './routes/news.routes.js';
import adminRoutes from './routes/admin.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';

import adminVoucherRoutes from './routes/admin/voucher.admin.routes.js';
import adminDashboardRoutes from './routes/admin/dashboard.routes.js';

EventEmitter.defaultMaxListeners = 20;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
    origin: "http://localhost:4200", 
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTION"], 
    credentials: true // gửi cookie/token cho xác thực
}));

app.use(express.json({ limit: '10mb' }));        
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secretkey123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


// User
app.use('/api', authRoutes)
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/voucher", voucherRoutes);
app.use("/api/cart", cartRoutes);

// Kết nối route admin
app.use('/api/admin', adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/news", newsRoutes);  

// Admin
app.use("/api/admin/vouchers", adminVoucherRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes)
app.get("/", (req, res) => {
    res.send("Backend + MongoDB đang chạy !");
});

export default app;