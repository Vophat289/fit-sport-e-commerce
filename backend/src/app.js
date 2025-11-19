import express from 'express';
import cors from 'cors';
import session from 'express-session'; 
import passport from './config/auth.js'; 
<<<<<<< HEAD

import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js'
import authRoutes from './routes/auth.routes.js';
import voucherRoutes from './routes/voucher.routes.js';
import cartRoutes from './routes/cart.routes.js';
import { EventEmitter } from 'events';

EventEmitter.defaultMaxListeners = 20

const app = express();

app.use(cors({
    origin:"http://localhost:4200", //connect với frontend
    method: ["GET", "POST", "DELETE"],
    credentials: true // gửi cookie, token, jwt để xác thực
}));
app.use(express.json());

app.use(session({
    secret: 'secretkey123', 
    resave: false,
    saveUninitialized: false, // Set false nếu dùng cho API server
    cookie: { 
        secure: true // Set true nếu dùng HTTPS
    } 
=======
import contactRoutes from './routes/contact.routes.js';
// import adminContactRoutes from './routes/adminContact.route.js'; // tạm comment

const app = express();

app.use(cors({ origin: "http://localhost:4200", credentials: true }));
app.use(express.json());

app.use(session({
  secret: 'secretkey123',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // dùng HTTP
>>>>>>> 918f4c1 (updatecode thanhdanh)
}));

app.use(passport.initialize());
app.use(passport.session());

<<<<<<< HEAD
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/voucher", voucherRoutes);
app.use("/api/cart", cartRoutes);

app.get("/", (req, res) => {
    res.send("backend + mongodb đang chạy", productRoutes);
})

export default app;
=======
app.use("/api/contact", contactRoutes);

app.get("/", (req, res) => res.send("Backend + MongoDB đang chạy"));

// app.use("/api/admin/contacts", adminContactRoutes); // tạm bỏ để tránh crash

export default app;
>>>>>>> 918f4c1 (updatecode thanhdanh)
