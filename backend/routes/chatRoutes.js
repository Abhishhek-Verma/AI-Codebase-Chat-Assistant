import { Router } from 'express';
import { queryChat, getChatHistory, clearChatHistory } from '../controllers/chatController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Require Google login for all chat endpoints
router.use(requireAuth);

/**
 * POST /api/chat/query
 * Stream answer via SSE and persist to user's chat history for this repo
 */
router.post('/query', queryChat);

/**
 * GET /api/chat/history?repoUrl=...
 * Fetch persistent conversation history for this repo
 */
router.get('/history', getChatHistory);

/**
 * DELETE /api/chat/history?repoUrl=...
 * Clear conversation history for this repo
 */
router.delete('/history', clearChatHistory);

export default router;
