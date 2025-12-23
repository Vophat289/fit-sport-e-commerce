
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
import orderRoutes from "./routes/order.routes.js";


import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
// import adminRoutes from './routes/admin.routes.js';
import adminVoucherRoutes from './routes/admin/voucher.admin.routes.js';
import adminDashboardRoutes from './routes/admin/dashboard.routes.js';
import adminContactRoutes from './routes/admin/contact.admin.routes.js';
import adminNewsRoutes from './routes/admin/news.admin.routes.js';
import adminOrderRoutes from './routes/admin/order.admin.routes.js';
import adminVariantRoutes from './routes/admin/variant.admin.routes.js';
import vnpayRoute from "./routes/vnpay.route.js";
import { returnUrl } from "./controllers/vnpay.controller.js";

EventEmitter.defaultMaxListeners = 20;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
    origin: "https://fitsport.io.vn",
    methods: ["GET", "POST", "PUT", "DELETE","PATCH",'OPTIONS'],

    origin: ["http://localhost:4200", "https://fitsport.io.vn", "https://www.fitsport.io.vn"], 
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], 

    credentials: true
}));


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secretkey123",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// User
app.use("/api", authRoutes);
app.use("/api/auth", authRoutes);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/uploads", express.static("uploads"));
app.use("/uploads/news", express.static("uploads/news"));

app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/voucher", voucherRoutes);
app.use("/api/account/vouchers", voucherRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
// app.use ("/api/news", newsRoutes);

// Kết nối route admin
app.use("/api/contact", contactRoutes);

// Admin
// app.use("/api/admin", adminRoutes); 
app.use("/api/admin/vouchers", adminVoucherRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/contacts", adminContactRoutes);
app.use("/api/admin", adminVariantRoutes);
app.use("/api/admin/news", adminNewsRoutes);
app.use("/api/admin/orders", adminOrderRoutes);

app.use("/api/vnpay", vnpayRoute);

// Route cho VNPay return URL - VNPay merchant portal đã cấu hình URL này
app.get("/api/payment-success/return", returnUrl);

// Health check endpoint (cho Docker healthcheck)
app.get("/api/health", (req, res) => {
    res.status(200).json({ 
        status: "OK", 
        message: "Server đang chạy",
        timestamp: new Date().toISOString()
    });
});

app.get("/", (req, res) => {
  res.send("Backend + MongoDB đang chạy !");
});

// Global error handler middleware (phải đặt cuối cùng, sau tất cả routes)
app.use((err, req, res, next) => {
    console.error('❌ Global Error Handler:', err);
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }
    
    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'ID không hợp lệ'
        });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
    
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token đã hết hạn'
        });
    }
    
    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi server',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler (phải đặt sau tất cả routes)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route không tồn tại'
    });
});

export default app;
