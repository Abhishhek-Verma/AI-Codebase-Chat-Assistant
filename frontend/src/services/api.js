/**
 * API Service with Multi-Tenant Google Authentication & Persistent Chat
 *
 * Handles communication with the backend API, automatically attaching
 * Google OAuth bearer tokens.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'codebase_auth_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Build request headers including tenant auth context
 */
function getHeaders(extraHeaders = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Login with Google ID Token / Credential
 */
export async function loginWithGoogle(credential) {
  const response = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sign in with Google');
  }

  const data = await response.json();
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

/**
 * Fetch current authenticated user profile and repos
 */
export async function getCurrentUser() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        clearStoredToken();
      }
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Index a GitHub repository in the user's isolated namespace
 */
export async function indexRepository(repoUrl) {
  const response = await fetch(`${BASE_URL}/repo/index`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ repoUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to index repository');
  }

  return response.json();
}

/**
 * Get current index status for user's isolated namespace
 */
export async function getRepoStatus() {
  const response = await fetch(`${BASE_URL}/repo/status`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to fetch status');
  }
  return response.json();
}

/**
 * Switch active repository for user
 */
export async function switchActiveRepo(repoUrl) {
  const response = await fetch(`${BASE_URL}/repo/select`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ repoUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to switch repository');
  }

  return response.json();
}

/**
 * Fetch persistent chat history for a repository
 */
export async function fetchChatHistory(repoUrl) {
  const token = getStoredToken();
  if (!token) return [];

  try {
    const query = repoUrl ? `?repoUrl=${encodeURIComponent(repoUrl)}` : '';
    const response = await fetch(`${BASE_URL}/chat/history${query}`, {
      headers: getHeaders(),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.history || [];
  } catch {
    return [];
  }
}

/**
 * Clear chat history for a repository
 */
export async function clearChatHistoryApi(repoUrl) {
  const query = repoUrl ? `?repoUrl=${encodeURIComponent(repoUrl)}` : '';
  const response = await fetch(`${BASE_URL}/chat/history${query}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to clear chat history');
  }
  return response.json();
}

/**
 * Send a chat query and receive streaming response from user's isolated namespace
 */
export async function streamChat(question, history, onToken, onRefs, onDone, onError, repoUrl = null) {
  try {
    const response = await fetch(`${BASE_URL}/chat/query`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ question, history, repoUrl }),
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
            if (parsed.error) {
              onError(parsed.error);
              return;
            }
          } catch {
            // Skip unparseable chunks
          }
        }
      }
    }

    onDone();
  } catch (error) {
    onError(error.message);
  }
}
