/**
 * Re-ranker
 * 
 * Re-ranks retrieved chunks by semantic relevance to the query.
 * Uses LLM-based scoring to reorder candidates.
 */

/**
 * Re-rank chunks by relevance to the query
 * @param {string} query - user question
 * @param {Array<{text: string, metadata: object, score: number}>} chunks
 * @param {number} topK - number of results to return
 * @returns {Promise<Array>} re-ranked top-K chunks
 */
export async function rerank(query, chunks, topK = 5) {
  if (!chunks || chunks.length === 0) return [];
  if (chunks.length <= topK) return chunks;

  // Simple heuristic re-ranking based on:
  // 1. Original vector similarity score (primary)
  // 2. Query keyword overlap (secondary boost)

  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

  const scored = chunks.map((chunk) => {
    let score = chunk.score || 0;

    // Boost chunks that contain query keywords
    const textLower = chunk.text.toLowerCase();
    const metaLower = JSON.stringify(chunk.metadata).toLowerCase();

    for (const term of queryTerms) {
      if (textLower.includes(term)) score += 0.05;
      if (metaLower.includes(term)) score += 0.03;
    }

    // Boost chunks that are function/class definitions (more informative)
    if (chunk.metadata.type === 'function' || chunk.metadata.type === 'class') {
      score += 0.02;
    }

    return { ...chunk, score };
  });

  // Sort by score descending and take top-K
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
