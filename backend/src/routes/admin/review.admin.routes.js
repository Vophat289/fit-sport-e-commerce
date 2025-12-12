import express from 'express';
import { getAllReviews } from '../../controllers/admin/review.admin.controller.js';

const router = express.Router();

// CHỈ LẤY DANH SÁCH
router.get('/', getAllReviews);

export default router;
