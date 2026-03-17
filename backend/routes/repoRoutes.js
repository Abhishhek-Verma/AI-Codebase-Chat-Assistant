import { Router } from 'express';
import { indexRepo, getStatus } from '../controllers/repoController.js';

const router = Router();

/**
 * POST /api/repo/index
 * Body: { repoUrl: string }
 * Triggers full ingestion pipeline: fetch → parse → chunk → embed → store
 */
router.post('/index', indexRepo);

/**
 * GET /api/repo/status
 * Returns current index status (indexed repo, chunk count, etc.)
 */
router.get('/status', getStatus);

export default router;
