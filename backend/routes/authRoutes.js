import { Router } from 'express';
import { googleLogin, demoLogin, getCurrentUser } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/google', googleLogin);
router.post('/demo', demoLogin);
router.get('/me', requireAuth, getCurrentUser);

export default router;
