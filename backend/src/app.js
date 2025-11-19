import express from 'express';
import cors from 'cors';
import session from 'express-session'; 
import passport from './config/auth.js'; 
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
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/contact", contactRoutes);

app.get("/", (req, res) => res.send("Backend + MongoDB đang chạy"));

// app.use("/api/admin/contacts", adminContactRoutes); // tạm bỏ để tránh crash

export default app;
