/**
 * User Store Service
 * 
 * Persistent storage for user profiles and their indexed repositories.
 * Stored in backend/data/user_store.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
 * Generate safe ASCII namespace for Pinecone from user ID / email
 */
export function getNamespaceForUser(userId) {
  if (!userId) return 'default';
  // Pinecone namespace: alphanumeric, underscore, hyphen
  const clean = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `ns_${clean.slice(0, 50)}`;
}

/**
 * Get user record
 */
export function getUser(userId) {
  const store = loadStore();
  return store.users[userId] || null;
}

/**
 * Upsert user profile
 */
export function upsertUser(user) {
  const store = loadStore();
  const existing = store.users[user.id] || {
    id: user.id,
    repos: [],
    activeRepo: null,
    createdAt: new Date().toISOString(),
  };

  store.users[user.id] = {
    ...existing,
    email: user.email || existing.email,
    name: user.name || existing.name,
    picture: user.picture || existing.picture,
    namespace: getNamespaceForUser(user.id),
    lastLoginAt: new Date().toISOString(),
  };

  saveStore();
  return store.users[user.id];
}

/**
 * Record a newly indexed repo for a user
 */
export function recordIndexedRepo(userId, repoData) {
  const store = loadStore();
  const user = store.users[userId];
  if (!user) return;

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
    repos: user.repos,
    activeRepo: active,
  };
}

export const userStore = {
  getNamespaceForUser,
  getUser,
  upsertUser,
  recordIndexedRepo,
  setActiveRepo,
  getUserRepoData,
};
