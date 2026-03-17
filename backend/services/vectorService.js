/**
 * Vector Service — Pinecone
 *
 * Manages vector storage and retrieval using Pinecone cloud vector database.
 * Replaces local FAISS for production deployments.
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
 * Upsert chunks and their embeddings into Pinecone
 * @param {Array<{text: string, metadata: object}>} chunks
 * @param {number[][]} embeddings
 */
async function createIndex(chunks, embeddings) {
  const index = await getIndex();

  // Build Pinecone records — batch in groups of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batchChunks = chunks.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = embeddings.slice(i, i + BATCH_SIZE);

    const vectors = batchChunks.map((chunk, j) => ({
      id: `chunk-${i + j}`,
      values: batchEmbeddings[j],
      metadata: {
        text: chunk.text.slice(0, 8000), // Pinecone metadata limit
        file: chunk.metadata.file || '',
        startLine: chunk.metadata.startLine || 0,
        endLine: chunk.metadata.endLine || 0,
        language: chunk.metadata.language || '',
        repo: chunk.metadata.repo || '',
      },
    }));

    await index.upsert({ records: vectors });

    // Small delay to respect rate limits
    if (i + BATCH_SIZE < chunks.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
}

/**
 * Query Pinecone for the top-k similar vectors
 * @param {number[]} queryVector
 * @param {number} k
 * @returns {Promise<Array<{text, metadata, score}>>}
 */
async function search(queryVector, k = 20) {
  const index = await getIndex();

  const result = await index.query({
    vector: queryVector,
    topK: k,
    includeMetadata: true,
  });

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
 * Get current index status from Pinecone stats
 * @returns {Promise<{indexed: boolean, totalChunks: number}>}
 */
async function getIndexStatus() {
  try {
    const index = await getIndex();
    const stats = await index.describeIndexStats();
    const totalChunks = stats.totalRecordCount || 0;

    return {
      indexed: totalChunks > 0,
      totalChunks,
      repo: 'Pinecone index',
    };
  } catch {
    return {
      indexed: false,
      totalChunks: 0,
      message: 'No repository indexed yet',
    };
  }
}

export const vectorService = {
  createIndex,
  search,
  getIndexStatus,
};
