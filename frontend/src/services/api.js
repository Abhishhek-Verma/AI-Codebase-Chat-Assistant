/**
 * API Service with JWT Authentication (Access + Refresh Tokens) & Persistent Chat
 *
 * Handles communication with the backend API, automatically attaching
 * JWT access tokens and handling automatic token refresh when expired.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ACCESS_TOKEN_KEY = 'codebase_access_token';
const REFRESH_TOKEN_KEY = 'codebase_refresh_token';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Build request headers including JWT Bearer token
 */
function getHeaders(extraHeaders = {}) {
  const token = getAccessToken();
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
 * Attempt to refresh expired access token using refresh token
 */
export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

/**
 * Wrapper around fetch with automatic token refresh on 401 TOKEN_EXPIRED
 */
async function authFetch(url, options = {}) {
  let headers = getHeaders(options.headers || {});
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    let errBody = null;
    try {
      errBody = await response.clone().json();
    } catch {}

    if (errBody?.code === 'TOKEN_EXPIRED') {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers = getHeaders(options.headers || {});
        response = await fetch(url, { ...options, headers });
      }
    }
  }

  return response;
}

/**
 * Register a new user
 */
export async function signupUser({ name, email, password }) {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create account');
  }

  setTokens(data.accessToken, data.refreshToken);
  return data;
}

/**
 * Sign in existing user
 */
export async function loginUser({ email, password }) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to sign in');
  }

  setTokens(data.accessToken, data.refreshToken);
  return data;
}

/**
 * Logout user
 */
export async function logoutUser() {
  try {
    await authFetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
  } catch {}
  clearTokens();
}

/**
 * Fetch current authenticated user profile and repos
 */
export async function getCurrentUser() {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const response = await authFetch(`${BASE_URL}/auth/me`);
    if (!response.ok) {
      if (response.status === 401) {
        clearTokens();
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
  const response = await authFetch(`${BASE_URL}/repo/index`, {
    method: 'POST',
    body: JSON.stringify({ repoUrl }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to index repository');
  }

  return data;
}

/**
 * Get current index status for user's isolated namespace
 */
export async function getRepoStatus() {
  const response = await authFetch(`${BASE_URL}/repo/status`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch status');
  }
  return data;
}

/**
 * Switch active repository for user
 */
export async function switchActiveRepo(repoUrl) {
  const response = await authFetch(`${BASE_URL}/repo/select`, {
    method: 'POST',
    body: JSON.stringify({ repoUrl }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to switch repository');
  }

  return data;
}

/**
 * Fetch persistent chat history for a repository
 */
export async function fetchChatHistory(repoUrl) {
  const token = getAccessToken();
  if (!token) return [];

  try {
    const query = repoUrl ? `?repoUrl=${encodeURIComponent(repoUrl)}` : '';
    const response = await authFetch(`${BASE_URL}/chat/history${query}`);
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
  const response = await authFetch(`${BASE_URL}/chat/history${query}`, {
    method: 'DELETE',
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
    const response = await authFetch(`${BASE_URL}/chat/query`, {
      method: 'POST',
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
