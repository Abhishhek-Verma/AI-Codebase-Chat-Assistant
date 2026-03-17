/**
 * Embedding Service
 * 
 * Generates vector embeddings for text using OpenAI.
 * Used for both indexing (batch) and querying (single).
 */

import { OpenAIEmbeddings } from '@langchain/openai';

// Singleton embedding model instance
let embeddingModel = null;

/**
 * Get or create the embedding model instance
 */
function getModel() {
  if (embeddingModel) return embeddingModel;

  embeddingModel = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-small',
  });

  return embeddingModel;
}

/**
 * Generate embedding for a single text string
 * @param {string} text
 * @returns {Promise<number[]>} embedding vector
 */
async function generateEmbedding(text) {
  const model = getModel();
  const vector = await model.embedQuery(text);
  return vector;
}

/**
 * Generate embeddings for multiple texts (batch, with rate limiting)
 * @param {string[]} texts
 * @returns {Promise<number[][]>} array of embedding vectors
 */
async function generateBatchEmbeddings(texts) {
  const model = getModel();
  const BATCH_SIZE = 100; // OpenAI supports larger batches
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const embeddings = await model.embedDocuments(batch);
    allEmbeddings.push(...embeddings);

    // Rate limit: pause between batches
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return allEmbeddings;
}

export const embeddingService = {
  generateEmbedding,
  generateBatchEmbeddings,
};
