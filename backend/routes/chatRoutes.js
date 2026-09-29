import { Router } from 'express';
import { queryChat } from '../controllers/chatController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * Apply auth middleware to chat queries
 * Isolates vector similarity search to req.user.namespace
 */
router.use(requireAuth);

/**
 * POST /api/chat/query
 * Body: { question: string, history?: array }
 * Response: SSE stream of LLM answer using context retrieved from user's namespace
 */
router.post('/query', queryChat);

export default router;
