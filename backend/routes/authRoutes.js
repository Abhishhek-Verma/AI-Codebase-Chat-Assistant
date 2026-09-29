import { Router } from 'express';
import { signup, login, refreshTokenHandler, logout, getCurrentUser } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public auth routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refreshTokenHandler);

// Protected auth routes
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getCurrentUser);

export default router;
