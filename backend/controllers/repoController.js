import { indexRepository } from '../rag/indexing/indexRepo.js';
import { vectorService } from '../services/vectorService.js';
import { userStore } from '../services/userStore.js';

/**
 * POST /api/repo/index
 * Body: { repoUrl: string }
 *
 * Triggers the full ingestion pipeline into the user's isolated Pinecone namespace.
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
      return res.status(400).json({ error: 'Invalid GitHub URL format. Example: https://github.com/expressjs/express' });
    }

    const userId = req.user?.id || 'guest_default';
    const userNamespace = req.user?.namespace || userStore.getNamespaceForUser(userId);

    const result = await indexRepository(repoUrl, 'main', userNamespace);

    // Save to user store history
    userStore.recordIndexedRepo(userId, {
      repoUrl,
      totalFiles: result.totalFiles,
      totalChunks: result.totalChunks,
    });

    res.json({
      message: 'Repository indexed successfully',
      repo: repoUrl,
      totalFiles: result.totalFiles,
      totalChunks: result.totalChunks,
      namespace: userNamespace,
    });
  } catch (error) {
    console.error('[repoController] indexRepo error:', error);
    res.status(500).json({ error: `Failed to index repository: ${error.message}` });
  }
}

/**
 * GET /api/repo/status
 * Returns current index status for the authenticated user's isolated namespace
 */
export async function getStatus(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.json({
        indexed: false,
        totalChunks: 0,
        message: 'Sign in to view your indexed repositories',
        repos: [],
        activeRepo: null,
      });
    }

    const userNamespace = req.user.namespace || userStore.getNamespaceForUser(userId);
    const { repos, activeRepo } = userStore.getUserRepoData(userId);

    const status = await vectorService.getIndexStatus(userNamespace, activeRepo?.repoUrl);

    res.json({
      ...status,
      repos: repos || [],
      activeRepo: activeRepo || null,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture,
      },
    });
  } catch (err) {
    console.error('[repoController] getStatus error:', err);
    res.json({
      indexed: false,
      totalChunks: 0,
      message: 'No repository indexed yet',
      repos: [],
      activeRepo: null,
    });
  }
}

/**
 * GET /api/repo/list
 * Returns all repos indexed by the authenticated user
 */
export async function getUserRepos(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const data = userStore.getUserRepoData(userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/repo/select
 * Select active repository for the authenticated user
 */
export async function selectRepo(req, res) {
  try {
    const userId = req.user?.id;
    const { repoUrl } = req.body;
    if (!userId || !repoUrl) {
      return res.status(400).json({ error: 'repoUrl is required' });
    }

    const success = userStore.setActiveRepo(userId, repoUrl);
    if (!success) {
      return res.status(404).json({ error: 'Repository not found in your indexed list' });
    }

    const { repos, activeRepo } = userStore.getUserRepoData(userId);
    const userNamespace = req.user.namespace || userStore.getNamespaceForUser(userId);
    const status = await vectorService.getIndexStatus(userNamespace, activeRepo?.repoUrl);

    res.json({
      success: true,
      activeRepo,
      repos,
      totalChunks: status.totalChunks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
