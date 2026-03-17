/**
 * Vector Service
 *
 * Manages the FAISS vector index: create, load, search, and status.
 * Uses faiss-node for local vector similarity search.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { IndexFlatL2 } = require('faiss-node');
import fs from 'fs';
import path from 'path';

const VECTOR_STORE_PATH = process.env.VECTOR_STORE_PATH || './data/faiss_index';
const INDEX_FILE = path.join(VECTOR_STORE_PATH, 'index.faiss');
const METADATA_FILE = path.join(VECTOR_STORE_PATH, 'metadata.json');

// In-memory state
let faissIndex = null;
let storedChunks = [];
let indexedRepo = '';

function ensureDir() {
  if (!fs.existsSync(VECTOR_STORE_PATH)) {
    fs.mkdirSync(VECTOR_STORE_PATH, { recursive: true });
  }
}

/**
 * Create a new FAISS index from chunks and their embeddings, save to disk
 * @param {Array<{text: string, metadata: object}>} chunks
 * @param {number[][]} embeddings
 */
async function createIndex(chunks, embeddings) {
  if (!embeddings || embeddings.length === 0) {
    throw new Error('No embeddings provided');
  }

  const dimension = embeddings[0].length;
  const index = new IndexFlatL2(dimension);

  for (const embedding of embeddings) {
    index.add(embedding);
  }

  ensureDir();
  index.write(INDEX_FILE);

  const metadata = {
    chunks: chunks.map((c) => ({ text: c.text, metadata: c.metadata })),
    repo: chunks[0]?.metadata?.repo || '',
    totalChunks: chunks.length,
    dimension,
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));

  faissIndex = index;
  storedChunks = metadata.chunks;
  indexedRepo = metadata.repo;
}

/**
 * Load an existing FAISS index from disk
 */
async function loadIndex() {
  if (faissIndex) return;

  if (!fs.existsSync(INDEX_FILE) || !fs.existsSync(METADATA_FILE)) {
    throw new Error('No FAISS index found on disk. Index a repository first.');
  }

  faissIndex = IndexFlatL2.read(INDEX_FILE);
  const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  storedChunks = metadata.chunks;
  indexedRepo = metadata.repo;
}

/**
 * Search the index for top-k similar vectors
 * @param {number[]} queryVector
 * @param {number} k - number of results
 * @returns {Promise<Array<{text: string, metadata: object, score: number}>>}
 */
async function search(queryVector, k = 20) {
  if (!faissIndex) {
    await loadIndex();
  }

  const actualK = Math.min(k, storedChunks.length);
  const result = faissIndex.search(queryVector, actualK);

  const results = [];
  for (let i = 0; i < result.labels.length; i++) {
    const idx = result.labels[i];
    if (idx >= 0 && idx < storedChunks.length) {
      results.push({
        text: storedChunks[idx].text,
        metadata: storedChunks[idx].metadata,
        score: 1 / (1 + result.distances[i]),
      });
    }
  }
  return results;
}

/**
 * Get current index status
 * @returns {Promise<{indexed: boolean, totalChunks: number, repo: string}>}
 */
async function getIndexStatus() {
  if (!faissIndex && fs.existsSync(METADATA_FILE)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
      return {
        indexed: true,
        totalChunks: metadata.totalChunks,
        repo: metadata.repo,
        dimension: metadata.dimension,
        createdAt: metadata.createdAt,
      };
    } catch {
      // Fall through
    }
  }

  if (faissIndex) {
    return { indexed: true, totalChunks: storedChunks.length, repo: indexedRepo };
  }

  return { indexed: false, totalChunks: 0, message: 'No repository indexed yet' };
}

export const vectorService = {
  createIndex,
  loadIndex,
  search,
  getIndexStatus,
};
