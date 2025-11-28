// src/app.js
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
import adminRoutes from './routes/admin.routes.js';
import { EventEmitter } from 'events';

EventEmitter.defaultMaxListeners = 20;

const app = express();

// CORS
app.use(cors({
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true // gửi cookie/token cho xác thực
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(session({
    secret: 'secretkey123', 
    saveUninitialized: false,
    cookie: {
        secure: false, 
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// ROUTES
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/voucher", voucherRoutes);
app.use("/api/cart", cartRoutes);
// Kết nối route admin
app.use('/api/admin', adminRoutes);
// Test route
app.get("/", (req, res) => {
    res.send("Backend + MongoDB đang chạy!");
});

export default app;
