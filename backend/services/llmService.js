/**
 * LLM Service
 * 
 * Handles LLM interaction with Groq (e.g. LLaMA 3.3 70B Versatile)
 * with streaming support and OpenAI fallback.
 */

import { ChatOpenAI } from '@langchain/openai';

// Singleton LLM instance
let llmModel = null;

/**
 * Get or create the LLM model instance
 */
function getModel() {
  if (llmModel) return llmModel;

  const groqApiKey = process.env.GROQ_API_KEY;

  if (groqApiKey && !groqApiKey.includes('your_groq_api_key')) {
    llmModel = new ChatOpenAI({
      apiKey: groqApiKey,
      configuration: {
        baseURL: 'https://api.groq.com/openai/v1',
      },
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.2,
      maxTokens: 4096,
      streaming: true,
    });
  } else if (process.env.OPENAI_API_KEY) {
    llmModel = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 2048,
      streaming: true,
    });
  } else {
    throw new Error('No LLM API key configured. Please set GROQ_API_KEY in backend/.env');
  }

  return llmModel;
}

/**
 * Reset model instance (useful when config changes)
 */
function resetModel() {
  llmModel = null;
}

/**
 * Generate a full (non-streaming) answer from the LLM
 * @param {string} prompt
 * @returns {Promise<string>} complete answer
 */
async function generateAnswer(prompt) {
  const model = getModel();
  const response = await model.invoke(prompt);
  return response.content;
}

/**
 * Stream answer tokens from the LLM (returns async generator)
 * @param {string} prompt
 * @returns {AsyncGenerator<string>} token stream
 */
async function* streamAnswer(prompt) {
  const model = getModel();
  const stream = await model.stream(prompt);

  for await (const chunk of stream) {
    if (chunk.content) {
      yield chunk.content;
    }
  }
}

export const llmService = {
  generateAnswer,
  streamAnswer,
  resetModel,
};

