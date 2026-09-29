/**
 * User Store Service
 * 
 * Persistent storage for user accounts (with hashed passwords),
 * refresh tokens, indexed repositories, and per-repository chat histories.
 * Stored in backend/data/user_store.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.resolve(__dirname, '../data/user_store.json');

// In-memory cache
let storeCache = null;

function loadStore() {
  if (storeCache) return storeCache;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, 'utf-8');
      storeCache = JSON.parse(data);
    } else {
      storeCache = { users: {} };
      saveStore();
    }
  } catch (err) {
    console.error('[userStore] Error reading user store:', err.message);
    storeCache = { users: {} };
  }
  return storeCache;
}

function saveStore() {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(storeCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[userStore] Error writing user store:', err.message);
  }
}

/**
 * Generate safe ASCII namespace for Pinecone from user ID
 */
export function getNamespaceForUser(userId) {
  if (!userId) return 'default';
  const clean = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `ns_${clean.slice(0, 50)}`;
}

/**
 * Remove sensitive data like passwordHash and refreshToken before sending to client
 */
export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, refreshToken, ...safeUser } = user;
  return safeUser;
}

/**
 * Find user by email (case-insensitive)
 */
export function findUserByEmail(email) {
  if (!email) return null;
  const store = loadStore();
  const normalized = email.trim().toLowerCase();
  for (const id in store.users) {
    if (store.users[id]?.email?.toLowerCase() === normalized) {
      return store.users[id];
    }
  }
  return null;
}

/**
 * Get user by ID
 */
export function getUser(userId) {
  const store = loadStore();
  return store.users[userId] || null;
}

/**
 * Create a new user with hashed password
 */
export async function createUser({ name, email, password }) {
  const store = loadStore();
  const normalizedEmail = email.trim().toLowerCase();

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const namespace = getNamespaceForUser(userId);

  const newUser = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    namespace,
    repos: [],
    activeRepo: null,
    chats: {},
    refreshToken: null,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  store.users[userId] = newUser;
  saveStore();
  return newUser;
}

/**
 * Validate password against stored bcrypt hash
 */
export async function validatePassword(user, password) {
  if (!user || !user.passwordHash) return false;
  return bcrypt.compare(password, user.passwordHash);
}

/**
 * Store active refresh token
 */
export function updateRefreshToken(userId, refreshToken) {
  const store = loadStore();
  if (store.users[userId]) {
    store.users[userId].refreshToken = refreshToken;
    store.users[userId].lastLoginAt = new Date().toISOString();
    saveStore();
  }
}

/**
 * Clear refresh token on logout
 */
export function clearRefreshToken(userId) {
  const store = loadStore();
  if (store.users[userId]) {
    store.users[userId].refreshToken = null;
    saveStore();
  }
}

/**
 * Record a newly indexed repo for a user
 */
export function recordIndexedRepo(userId, repoData) {
  const store = loadStore();
  const user = store.users[userId];
  if (!user) return;

  if (!user.repos) user.repos = [];
  if (!user.chats) user.chats = {};

  const repoIndex = user.repos.findIndex((r) => r.repoUrl === repoData.repoUrl);
  const entry = {
    repoUrl: repoData.repoUrl,
    totalFiles: repoData.totalFiles || 0,
    totalChunks: repoData.totalChunks || 0,
    indexedAt: new Date().toISOString(),
  };

  if (repoIndex >= 0) {
    user.repos[repoIndex] = entry;
  } else {
    user.repos.unshift(entry);
  }

  user.activeRepo = repoData.repoUrl;
  saveStore();
  return entry;
}

/**
 * Set active repository for user
 */
export function setActiveRepo(userId, repoUrl) {
  const store = loadStore();
  const user = store.users[userId];
  if (!user) return false;

  const exists = user.repos.some((r) => r.repoUrl === repoUrl);
  if (exists) {
    user.activeRepo = repoUrl;
    saveStore();
    return true;
  }
  return false;
}

/**
 * Get active repo and list of repos for user
 */
export function getUserRepoData(userId) {
  const store = loadStore();
  const user = store.users[userId];
  if (!user) {
    return {
      repos: [],
      activeRepo: null,
    };
  }

  const active = user.repos.find((r) => r.repoUrl === user.activeRepo) || user.repos[0] || null;

  return {
    repos: user.repos || [],
    activeRepo: active,
  };
}

/**
 * Get persistent chat history for a specific repository
 */
export function getChatHistory(userId, repoUrl) {
  const store = loadStore();
  const user = store.users[userId];
  if (!user || !user.chats) return [];
  const targetRepo = repoUrl || user.activeRepo;
  if (!targetRepo) return [];
  return user.chats[targetRepo] || [];
}

/**
 * Append a chat message to persistent history for a repository
 */
export function saveChatMessage(userId, repoUrl, message) {
  const store = loadStore();
  const user = store.users[userId];
  if (!user) return;
  if (!user.chats) user.chats = {};

  const targetRepo = repoUrl || user.activeRepo;
  if (!targetRepo) return;

  if (!user.chats[targetRepo]) {
    user.chats[targetRepo] = [];
  }

  user.chats[targetRepo].push({
    role: message.role,
    content: message.content,
    references: message.references || [],
    timestamp: new Date().toISOString(),
  });

  saveStore();
}

/**
 * Clear chat history for a repository
 */
export function clearChatHistory(userId, repoUrl) {
  const store = loadStore();
  const user = store.users[userId];
  if (!user || !user.chats) return;
  const targetRepo = repoUrl || user.activeRepo;
  if (targetRepo && user.chats[targetRepo]) {
    user.chats[targetRepo] = [];
    saveStore();
  }
}

export const userStore = {
  getNamespaceForUser,
  sanitizeUser,
  findUserByEmail,
  getUser,
  createUser,
  validatePassword,
  updateRefreshToken,
  clearRefreshToken,
  recordIndexedRepo,
  setActiveRepo,
  getUserRepoData,
  getChatHistory,
  saveChatMessage,
  clearChatHistory,
};
