import { Router } from 'express';
import { queryChat } from '../controllers/chatController.js';

const router = Router();

/**
 * POST /api/chat/query
 * Body: { question: string }
 * Response: SSE stream of LLM answer
 */
router.post('/query', queryChat);

export default router;
