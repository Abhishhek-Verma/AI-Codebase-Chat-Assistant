import { indexRepository } from '../rag/indexing/indexRepo.js';
import { vectorService } from '../services/vectorService.js';
import { userStore } from '../services/userStore.js';

/**
 * POST /api/repo/index
 * Body: { repoUrl: string }
 *
 * Triggers the ingestion pipeline into the user's isolated Pinecone namespace.
 * Multiple repositories persist without overwriting each other.
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

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. Please sign in with Google to index repositories.' });
    }

    const userNamespace = req.user.namespace || userStore.getNamespaceForUser(userId);

    const result = await indexRepository(repoUrl, 'main', userNamespace);

    // Save to user store history (persists multiple repositories)
    const entry = userStore.recordIndexedRepo(userId, {
      repoUrl,
      totalFiles: result.totalFiles,
      totalChunks: result.totalChunks,
    });

    res.json({
      message: 'Repository indexed successfully and saved to your personal workspace',
      repo: repoUrl,
      totalFiles: result.totalFiles,
      totalChunks: result.totalChunks,
      namespace: userNamespace,
      activeRepo: entry,
    });
  } catch (error) {
    console.error('[repoController] indexRepo error:', error);
    res.status(500).json({ error: `Failed to index repository: ${error.message}` });
  }
}

/**
 * GET /api/repo/status
 * Returns index status for the authenticated user's active repository
 */
export async function getStatus(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        indexed: false,
        totalChunks: 0,
        message: 'Sign in with Google to access your indexed repositories',
        repos: [],
        activeRepo: null,
      });
    }

    const userNamespace = req.user.namespace || userStore.getNamespaceForUser(userId);
    const { repos, activeRepo } = userStore.getUserRepoData(userId);

    if (!activeRepo) {
      return res.json({
        indexed: false,
        totalChunks: 0,
        repo: null,
        namespace: userNamespace,
        repos: repos || [],
        activeRepo: null,
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          picture: req.user.picture,
        },
      });
    }

    const status = await vectorService.getIndexStatus(userNamespace, activeRepo.repoUrl, activeRepo.totalChunks);

    res.json({
      indexed: true,
      totalChunks: activeRepo.totalChunks || status.totalChunks,
      repo: activeRepo.repoUrl,
      namespace: userNamespace,
      repos: repos || [],
      activeRepo: activeRepo,
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

    res.json({
      success: true,
      activeRepo,
      repos,
      totalChunks: activeRepo?.totalChunks || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
