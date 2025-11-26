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
import contactRoutes from './routes/contact.routes.js';
import newsRoutes from './routes/news.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';

EventEmitter.defaultMaxListeners = 20;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ======================
// CORS
// ======================
app.use(cors({
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
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
    secret: 'secretkey123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(passport.initialize());
app.use(passport.session());

// ======================
// Static folder uploads
// ======================
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ======================
// Mount routes
// ======================
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/voucher", voucherRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/news", newsRoutes); 

// Test route
app.get("/", (req, res) => {
    res.send("Backend + MongoDB đang chạy!");
});

export default app;
