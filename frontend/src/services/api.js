/**
 * API Service
 * 
 * Handles all communication with the backend API.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Index a GitHub repository
 * @param {string} repoUrl
 * @returns {Promise<object>}
 */
export async function indexRepository(repoUrl) {
  const response = await fetch(`${BASE_URL}/repo/index`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to index repository');
  }

  return response.json();
}

/**
 * Get current index status
 * @returns {Promise<object>}
 */
export async function getRepoStatus() {
  const response = await fetch(`${BASE_URL}/repo/status`);
  return response.json();
}

/**
 * Send a chat query and receive streaming response
 * @param {string} question
 * @param {Array} history - conversation history [{role, content}]
 * @param {function} onToken - callback for each token
 * @param {function} onRefs - callback for file references
 * @param {function} onDone - callback when stream ends
 * @param {function} onError - callback on error
 */
export async function streamChat(question, history, onToken, onRefs, onDone, onError) {
  try {
    const response = await fetch(`${BASE_URL}/chat/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, history }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send query');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              onToken(parsed.token);
            }
            if (parsed.references) {
              onRefs(parsed.references);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }

    onDone();
  } catch (error) {
    onError(error.message);
  }
}
