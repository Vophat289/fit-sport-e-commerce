// routes/favorite.routes.js
import express from 'express';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favorite.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.get('/', authMiddleware, getFavorites);
router.post('/', authMiddleware, addFavorite);
router.delete('/:productId', authMiddleware, removeFavorite);

export default router;