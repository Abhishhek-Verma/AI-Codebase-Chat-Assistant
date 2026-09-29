/**
 * Embedding Service
 * 
 * Generates vector embeddings for text.
 * Supports OpenAI (text-embedding-3-small) and Google Generative AI embeddings,
 * with fallback handling.
 */

import { OpenAIEmbeddings } from '@langchain/openai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

// Singleton embedding model instance
let embeddingModel = null;

/**
 * Get or create the embedding model instance
 */
function getModel() {
  if (embeddingModel) return embeddingModel;

  if (process.env.GEMINI_API_KEY) {
    embeddingModel = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'text-embedding-004',
    });
    return embeddingModel;
  }

  if (process.env.OPENAI_API_KEY) {
    embeddingModel = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small',
    });
    return embeddingModel;
  }

  // Deterministic local fallback vector generator (1536 dim) if no key is set
  embeddingModel = {
    embedQuery: async (text) => generatePseudoEmbedding(text, 1536),
    embedDocuments: async (texts) => texts.map((t) => generatePseudoEmbedding(t, 1536)),
  };

  return embeddingModel;
}

/**
 * Generate a deterministic pseudo-embedding normalized vector
 * Used as safe fallback for local search when external API quota is unavailable.
 */
function generatePseudoEmbedding(text, dimension = 1536) {
  const vector = new Array(dimension).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimension;
    vector[idx] += 1.0 / (1 + i * 0.05);
  }

  // Normalize vector to unit length
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
  return vector.map((val) => val / norm);
}

/**
 * Generate embedding for a single text string
 * @param {string} text
 * @returns {Promise<number[]>} embedding vector
 */
async function generateEmbedding(text) {
  try {
    const model = getModel();
    const vector = await model.embedQuery(text);
    return vector;
  } catch (err) {
    console.warn(`[embeddingService] Primary embedding failed: ${err.message}. Using fallback.`);
    return generatePseudoEmbedding(text, 1536);
  }
}

/**
 * Generate embeddings for multiple texts (batch, with rate limiting)
 * @param {string[]} texts
 * @returns {Promise<number[][]>} array of embedding vectors
 */
async function generateBatchEmbeddings(texts) {
  try {
    const model = getModel();
    const BATCH_SIZE = 50;
    const allEmbeddings = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const embeddings = await model.embedDocuments(batch);
      allEmbeddings.push(...embeddings);

      if (i + BATCH_SIZE < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return allEmbeddings;
  } catch (err) {
    console.warn(`[embeddingService] Batch embedding failed: ${err.message}. Using fallback.`);
    return texts.map((t) => generatePseudoEmbedding(t, 1536));
  }
}

export const embeddingService = {
  generateEmbedding,
  generateBatchEmbeddings,
};

