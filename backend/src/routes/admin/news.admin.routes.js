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
import path from 'path';

// Cấu hình multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/news/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

const router = express.Router();

// ==================== ADMIN ROUTES ====================
router.get('/', getAllNews);                                    
router.post('/', upload.single('thumbnail'), createNews);     
router.put('/slug/:slug', upload.single('thumbnail'), updateNewsBySlug); 
router.patch('/:id/toggle-hide', toggleHideNews);               
router.delete('/:slug', deleteNews);                          

// ==================== PUBLIC ROUTES (CHO TRANG CHỦ & BÀI VIẾT) ====================
router.get('/public', getPublicNews);                 
router.get('/latest', getLatestNews);                 
router.get('/detail/:slug', getNewsDetailBySlug);     

export default router;