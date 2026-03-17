/**
 * LLM Service
 * 
 * Handles LLM interaction with OpenAI (GPT-4o-mini) with streaming support.
 */

import { ChatOpenAI } from '@langchain/openai';

// Singleton LLM instance
let llmModel = null;

/**
 * Get or create the LLM model instance
 */
function getModel() {
  if (llmModel) return llmModel;

  llmModel = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 2048,
    streaming: true,
  });

  return llmModel;
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
};
