// backend/src/routes/contact.routes.js
import express from 'express';
import { 
  sendContactMail, 
  getAllContacts, 
  getContactById,
  deleteContact 
} from '../controllers/contact.controller.js';

const router = express.Router();

// Public: khách gửi liên hệ
router.post('/', sendContactMail);

// ADMIN ONLY: viết thẳng middleware ở đây, không cần file riêng
router.get('/', (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Chưa đăng nhập' });
  if (req.session?.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới vào được' });
  next();
}, getAllContacts);

router.get('/:id', (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Chưa đăng nhập' });
  if (req.session?.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới vào được' });
  next();
}, getContactById);

router.delete('/:id', (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Chưa đăng nhập' });
  if (req.session?.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới vào được' });
  next();
}, deleteContact);

export default router;