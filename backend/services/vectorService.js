/**
 * Vector Service — Pinecone with Multi-Tenant Namespace & Multi-Repo Metadata Filtering
 *
 * Manages vector storage and retrieval using Pinecone cloud vector database.
 * Every user is isolated into their own Pinecone namespace.
 * Multiple repositories coexist permanently within the user's namespace,
 * allowing instant repository switching without re-indexing.
 */

import { Pinecone } from '@pinecone-database/pinecone';

const PINECONE_INDEX = process.env.PINECONE_INDEX || 'codebase-rag';

// Singleton Pinecone client
let pineconeClient = null;
let pineconeIndex = null;

/**
 * Get or initialise the Pinecone client and index
 */
async function getIndex() {
  if (pineconeIndex) return pineconeIndex;

  pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  pineconeIndex = pineconeClient.index(PINECONE_INDEX);
  return pineconeIndex;
}

/**
 * Upsert chunks and their embeddings into Pinecone under a user-specific namespace
 * @param {Array<{text: string, metadata: object}>} chunks
 * @param {number[][]} embeddings
 * @param {string} namespace - Pinecone namespace for tenant isolation
 * @param {string} repoUrl - Target repository URL
 */
async function createIndex(chunks, embeddings, namespace = 'default', repoUrl = '') {
  const index = await getIndex();
  const ns = index.namespace(namespace);

  // Generate deterministic repo slug for unique vector IDs so multiple repos persist
  const repoSlug = Buffer.from(repoUrl || 'repo').toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);

  // Build Pinecone records — batch in groups of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batchChunks = chunks.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = embeddings.slice(i, i + BATCH_SIZE);

    const vectors = batchChunks.map((chunk, j) => ({
      id: `${namespace}-${repoSlug}-chunk-${i + j}`,
      values: batchEmbeddings[j],
      metadata: {
        text: chunk.text.slice(0, 8000), // Pinecone metadata limit
        file: chunk.metadata.file || '',
        startLine: chunk.metadata.startLine || 0,
        endLine: chunk.metadata.endLine || 0,
        language: chunk.metadata.language || '',
        repo: repoUrl || chunk.metadata.repo || '',
      },
    }));

    await ns.upsert({ records: vectors });

    // Small delay to respect rate limits
    if (i + BATCH_SIZE < chunks.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
}

/**
 * Query Pinecone for the top-k similar vectors within a user namespace,
 * filtered to the active repository.
 * @param {number[]} queryVector
 * @param {number} k
 * @param {string} namespace
 * @param {string} repoUrl
 * @returns {Promise<Array<{text, metadata, score}>>}
 */
async function search(queryVector, k = 20, namespace = 'default', repoUrl = null) {
  const index = await getIndex();
  const ns = index.namespace(namespace);

  const queryOptions = {
    vector: queryVector,
    topK: k,
    includeMetadata: true,
  };

  // Filter specifically for the active repository if provided
  if (repoUrl) {
    queryOptions.filter = {
      repo: { $eq: repoUrl },
    };
  }

  const result = await ns.query(queryOptions);

  return (result.matches || []).map((match) => ({
    text: match.metadata.text,
    metadata: {
      file: match.metadata.file,
      startLine: match.metadata.startLine,
      endLine: match.metadata.endLine,
      language: match.metadata.language,
      repo: match.metadata.repo,
    },
    score: match.score,
  }));
}

/**
 * Get current index status from Pinecone stats for a specific user namespace
 * @param {string} namespace
 * @param {string} repoName
 * @param {number} knownChunks
 * @returns {Promise<{indexed: boolean, totalChunks: number, repo: string}>}
 */
async function getIndexStatus(namespace = 'default', repoName = null, knownChunks = 0) {
  try {
    const index = await getIndex();
    const stats = await index.describeIndexStats();
    const namespaceCount = stats.namespaces?.[namespace]?.recordCount || 0;
    const totalChunks = knownChunks || namespaceCount;

    return {
      indexed: totalChunks > 0,
      totalChunks,
      repo: repoName || (totalChunks > 0 ? 'Indexed Repository' : null),
      namespace,
    };
  } catch {
    return {
      indexed: knownChunks > 0,
      totalChunks: knownChunks,
      message: 'No repository indexed yet',
      namespace,
    };
  }
}

export const vectorService = {
  createIndex,
  search,
  getIndexStatus,
};
