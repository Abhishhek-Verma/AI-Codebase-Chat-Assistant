import { embeddingService } from '../services/embeddingService.js';
import { vectorService } from '../services/vectorService.js';
import { retrievalService } from '../services/retrievalService.js';
import { rerank } from '../rag/reranking/rerank.js';
import { llmService } from '../services/llmService.js';

/**
 * POST /api/chat/query
 *
 * Body: { question: string, history?: Array<{role, content}> }
 *
 * Pipeline:
 *   1. embeddingService.generateEmbedding(question)
 *   2. vectorService.search(queryVector)
 *   3. retrievalService.filter(chunks)
 *   4. rerank(query, chunks)
 *   5. llmService.streamAnswer(prompt)
 *   6. SSE stream to frontend
 */
export async function queryChat(req, res) {
  try {
    const { question, history = [] } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    // 1. Generate embedding for the query
    const queryVector = await embeddingService.generateEmbedding(question);

    // 2. Vector similarity search (top-20 candidates)
    const candidates = await vectorService.search(queryVector, 20);

    if (!candidates || candidates.length === 0) {
      return res.status(404).json({
        error: 'No indexed codebase found. Please index a repository first.',
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

    const prompt = `You are an expert code assistant. Answer the developer's question using ONLY the provided code context. Always cite the file name and line numbers.

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

    for await (const chunk of stream) {
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

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process query' });
    }
  }
}
