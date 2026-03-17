import { indexRepository } from '../rag/indexing/indexRepo.js';
import { vectorService } from '../services/vectorService.js';

/**
 * POST /api/repo/index
 * Body: { repoUrl: string }
 *
 * Triggers the full ingestion pipeline:
 *   githubLoader → fileParser → chunkCode → embeddingService → vectorService
 */
export async function indexRepo(req, res) {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ error: 'repoUrl is required' });
    }

    // Validate GitHub URL format
    const githubUrlPattern = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+/;
    if (!githubUrlPattern.test(repoUrl)) {
      return res.status(400).json({ error: 'Invalid GitHub URL format' });
    }

    const result = await indexRepository(repoUrl);

    res.json({
      message: 'Repository indexed successfully',
      repo: repoUrl,
      totalFiles: result.totalFiles,
      totalChunks: result.totalChunks,
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to index repository: ${error.message}` });
  }
}

/**
 * GET /api/repo/status
 * Returns the current index status
 */
export async function getStatus(req, res) {
  try {
    const status = await vectorService.getIndexStatus();
    res.json(status);
  } catch {
    res.json({
      indexed: false,
      totalChunks: 0,
      message: 'No repository indexed yet',
    });
  }
}
