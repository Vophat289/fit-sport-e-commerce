// src/app.js
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from './config/auth.js';

import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import authRoutes from './routes/auth.routes.js';
import accountRoutes from './routes/account.routes.js'; // thêm account routes
import { EventEmitter } from 'events';

EventEmitter.defaultMaxListeners = 20;

const app = express();

// ======================
// CORS
// ======================
app.use(cors({
    origin: "http://localhost:4200", // frontend Angular
    methods: ["GET", "POST", "PUT", "DELETE"], // hỗ trợ các method
    credentials: true // gửi cookie/token cho xác thực
}));

// ======================
// Body parser
// ======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// Session & Passport
// ======================
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

// ======================
// ROUTES
// ======================
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes); // account routes thêm vào

// Test route
app.get("/", (req, res) => {
    res.send("Backend + MongoDB đang chạy!");
});

export default app;
