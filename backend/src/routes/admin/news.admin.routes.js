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

import upload from '../../middlewares/upload.middleware.js';

const router = express.Router();

// ADMIN
router.get('/', getAllNews);
router.post('/', upload.single('thumbnail'), createNews);
router.put('/slug/:slug', upload.single('thumbnail'), updateNewsBySlug);
router.patch('/:id/toggle-hide', toggleHideNews);
router.delete('/:slug', deleteNews);

// PUBLIC
router.get('/public', getPublicNews);
router.get('/latest', getLatestNews);
router.get('/detail/:slug', getNewsDetailBySlug);

export default router;
