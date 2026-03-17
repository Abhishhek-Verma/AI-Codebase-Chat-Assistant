/**
 * Retrieval Service
 * 
 * Retrieval pipeline: embed query → vector search → metadata filter.
 * Used by chatController to get relevant code context.
 */

import { embeddingService } from './embeddingService.js';
import { vectorService } from './vectorService.js';

/**
 * Filter chunks by metadata criteria
 * @param {Array<{text: string, metadata: object, score: number}>} chunks
 * @param {object} criteria - optional filter criteria
 * @returns {Array} filtered chunks
 */
function filter(chunks, criteria = {}) {
  let result = [...chunks];

  // Filter by language if specified
  if (criteria.language) {
    result = result.filter(
      (c) => c.metadata.language === criteria.language
    );
  }

  // Filter by folder path if specified
  if (criteria.folder) {
    result = result.filter(
      (c) => c.metadata.file && c.metadata.file.startsWith(criteria.folder)
    );
  }

  // Filter by file extension if specified
  if (criteria.extension) {
    result = result.filter(
      (c) => c.metadata.file && c.metadata.file.endsWith(criteria.extension)
    );
  }

  return result;
}

/**
 * Full retrieval pipeline: embed → search → filter
 * @param {string} query
 * @param {number} topK - number of results
 * @param {object} criteria - optional metadata filter
 * @returns {Promise<Array>} filtered chunks sorted by relevance
 */
async function retrieve(query, topK = 20, criteria = {}) {
  // 1. Embed the query
  const queryVector = await embeddingService.generateEmbedding(query);

  // 2. Search vector store
  const candidates = await vectorService.search(queryVector, topK);

  // 3. Apply metadata filters
  const filtered = filter(candidates, criteria);

  return filtered;
}

export const retrievalService = {
  filter,
  retrieve,
};
