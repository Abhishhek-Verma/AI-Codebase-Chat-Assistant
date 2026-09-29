import { embeddingService } from '../services/embeddingService.js';
import { vectorService } from '../services/vectorService.js';
import { retrievalService } from '../services/retrievalService.js';
import { rerank } from '../rag/reranking/rerank.js';
import { llmService } from '../services/llmService.js';
import { userStore } from '../services/userStore.js';

/**
 * POST /api/chat/query
 *
 * Body: { question: string, history?: Array<{role, content}>, repoUrl?: string }
 */
export async function queryChat(req, res) {
  try {
    const { question, history = [], repoUrl } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Please sign in with Google to chat.' });
    }

    const userNamespace = req.user.namespace || userStore.getNamespaceForUser(userId);
    const { activeRepo } = userStore.getUserRepoData(userId);
    const targetRepo = repoUrl || activeRepo?.repoUrl;

    if (!targetRepo) {
      return res.status(400).json({
        error: 'No active repository selected. Please index or select a repository first.',
      });
    }

    // 1. Generate embedding for the query
    const queryVector = await embeddingService.generateEmbedding(question);

    // 2. Vector similarity search filtered strictly by user namespace AND target repository
    const candidates = await vectorService.search(queryVector, 20, userNamespace, targetRepo);

    if (!candidates || candidates.length === 0) {
      return res.status(404).json({
        error: `No indexed chunks found for repository "${targetRepo}". Please index it first.`,
      });
    }

    // 3. Metadata filtering
    const filtered = retrievalService.filter(candidates);

    // 4. Re-rank to get top-5 most relevant chunks
    const topChunks = await rerank(question, filtered, 5);

    // 5. Build context from top chunks
    const context = topChunks
      .map(
        (chunk) =>
          `// File: ${chunk.metadata.file} | Lines: ${chunk.metadata.startLine}-${chunk.metadata.endLine}\n${chunk.text}`
      )
      .join('\n\n---\n\n');

    // Build conversation history for multi-turn context
    const historyBlock =
      history.length > 0
        ? `\n## Previous Conversation\n${history
            .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n\n')}\n`
        : '';

    const prompt = `You are an expert code assistant. Answer the developer's question using ONLY the provided code context from repository ${targetRepo}. Always cite the file name and line numbers.

## Code Context
${context}
${historyBlock}
## Current Question
${question}

## Instructions
- Explain in plain English first
- Show relevant code snippets with syntax highlighting (use markdown code blocks with language)
- Reference file paths and line numbers
- If the context doesn't contain enough info, say so honestly
- Be concise but thorough`;

    // 6. Stream LLM response via SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const stream = await llmService.streamAnswer(prompt);
    let fullResponse = '';

    for await (const chunk of stream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
    }

    // Send retrieved file references as final event
    const refs = topChunks.map((c) => ({
      file: c.metadata.file,
      lines: `${c.metadata.startLine}-${c.metadata.endLine}`,
      language: c.metadata.language,
      score: c.score,
    }));
    res.write(`data: ${JSON.stringify({ references: refs })}\n\n`);

    // Persist conversation in user store
    userStore.saveChatMessage(userId, targetRepo, { role: 'user', content: question.trim() });
    userStore.saveChatMessage(userId, targetRepo, { role: 'bot', content: fullResponse, references: refs });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[chatController] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to process query' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to process query' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}

/**
 * GET /api/chat/history
 * Query params: ?repoUrl=...
 */
export async function getChatHistory(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { repoUrl } = req.query;
    const history = userStore.getChatHistory(userId, repoUrl);
    res.json({ history: history || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/chat/history
 * Query params: ?repoUrl=...
 */
export async function clearChatHistory(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { repoUrl } = req.query;
    userStore.clearChatHistory(userId, repoUrl);
    res.json({ success: true, message: 'Chat history cleared for this repository' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
