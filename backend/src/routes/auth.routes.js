import express from 'express';
import { 
    register, 
    login, 
    verifyPin // verifyPin cho xác minh OTP
} from '../controllers/auth.controller.js';

const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/verify', verifyPin);

export default router;