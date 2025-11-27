// src/routes/news.routes.js
import express from 'express';
import {
  getAllNews,
  getNewsById,
  getNewsBySlug,
  createNews,
  updateNews,
  deleteNews,
  getLatestNews
} from '../controllers/news.controller.js';

const router = express.Router();

router.get('/', getAllNews);
router.get('/id/:id', getNewsById);
router.get('/slug/:slug', getNewsBySlug);

router.post('/', createNews);
router.put('/:id', updateNews);
router.delete('/:id', deleteNews);
router.get('/latest', getLatestNews);   
export default router;