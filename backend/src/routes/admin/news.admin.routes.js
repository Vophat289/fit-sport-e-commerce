// src/routes/admin/news.admin.routes.js
import express from 'express';
import {
  getAllNews,
  createNews,
  updateNewsBySlug,
  toggleHideNews,
  deleteNews,
  getPublicNews,
  getLatestNews,
  getNewsDetailBySlug
} from '../../controllers/admin/news.admin.controller.js';
import multer from 'multer';

// ==================== MULTER CONFIG (dùng memory để upload thẳng lên Cloudinary) ====================
const upload = multer({
  storage: multer.memoryStorage(),           // quan trọng: dùng buffer để Cloudinary nhận được
  limits: { fileSize: 5 * 1024 * 1024 },     // tối đa 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh!'));
    }
  }
});

const router = express.Router();

// ============================= ADMIN ROUTES =============================
router.get('/', getAllNews);                                 
router.post('/', upload.single('thumbnail'), createNews);        
router.put('/slug/:slug', upload.single('thumbnail'), updateNewsBySlug); 
router.patch('/:id/toggle-hide', toggleHideNews);                 
router.delete('/:slug', deleteNews);                              

// ============================= PUBLIC ROUTES =============================
router.get('/public', getPublicNews);        
router.get('/latest', getLatestNews);        
router.get('/detail/:slug', getNewsDetailBySlug); 

export default router;