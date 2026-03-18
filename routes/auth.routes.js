import express from 'express';
import { register, login, refresh, logout, forgotPassword, resetPassword, verifyEmail } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verifyemail/:token', verifyEmail);
router.post('/verifyemail', verifyEmail); // Also support POST with body

// Logout requires token to know who to logout
router.post('/logout', protect, logout);

export default router;
