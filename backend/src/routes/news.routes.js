// src/routes/news.routes.js
import express from 'express';
import {
  getAllNews,
  getNewsById,
  getNewsBySlug,
  createNews,
  updateNews,
  deleteNews
} from '../controllers/news.controller.js';

const router = express.Router();

router.get('/', getAllNews);
router.get('/id/:id', getNewsById);
router.get('/slug/:slug', getNewsBySlug);
// BỎ upload.single('thumbnail') đi luôn
router.post('/', createNews);
router.put('/:id', updateNews);
router.delete('/:id', deleteNews);

export default router;