import { Router } from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder
} from '../../controllers/admin/order.admin.controller.js';

const router = Router();

// REST API admin
router.get('/', getAllOrders);         // GET /api/admin/order?search=&page=&limit=
router.get('/:id', getOrderById);      // GET /api/admin/order/:id
router.post('/', createOrder);         // POST /api/admin/order
router.put('/:id', updateOrder);       // PUT /api/admin/order/:id
router.delete('/:id', deleteOrder);    // DELETE /api/admin/order/:id

export default router;
