// src/routes/admin/news.admin.routes.js
import express from 'express';
import {
  getAllNews,
  createNews,
  updateNews,
  toggleHideNews
} from '../../controllers/admin/news.admin.controller.js';
import multer from 'multer';
import path from 'path';

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

router.get('/', getAllNews);
router.post('/', upload.single('thumbnail'), createNews);
router.put('/slug/:slug', upload.single('thumbnail'), updateNews);
router.patch('/:id/toggle-hide', toggleHideNews);

export default router;