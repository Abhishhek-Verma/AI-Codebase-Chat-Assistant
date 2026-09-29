import { Router } from 'express';
import { indexRepo, getStatus, getUserRepos, selectRepo } from '../controllers/repoController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * Apply auth middleware to all repo endpoints
 * (supports Google token, demo token, or client session header fallback)
 */
router.use(requireAuth);

/**
 * POST /api/repo/index
 * Body: { repoUrl: string }
 * Triggers full ingestion pipeline into the user's isolated Pinecone namespace
 */
router.post('/index', indexRepo);

/**
 * GET /api/repo/status
 * Returns current index status for user's isolated namespace
 */
router.get('/status', getStatus);

/**
 * GET /api/repo/list
 * Returns list of repositories indexed by the authenticated user
 */
router.get('/list', getUserRepos);

/**
 * POST /api/repo/select
 * Select active repository for this user
 */
router.post('/select', selectRepo);

export default router;
