/**
 * Index Repository
 *
 * Orchestrates the full indexing pipeline for a GitHub repository:
 *   1. githubLoader → fetch repo tree
 *   2. fileParser → filter relevant files
 *   3. chunkCode → AST-aware code chunking
 *   4. embeddingService → generate embeddings
 *   5. vectorService → store in FAISS
 */

import { loadRepository, fetchFileContent } from '../ingestion/githubLoader.js';
import { filterFiles } from '../ingestion/fileParser.js';
import { chunkCode } from '../chunking/chunkCode.js';
import { embeddingService } from '../../services/embeddingService.js';
import { vectorService } from '../../services/vectorService.js';

/**
 * Run the full indexing pipeline
 * @param {string} repoUrl - GitHub repository URL
 * @param {string} branch - branch to index (default: "main")
 * @returns {Promise<{totalFiles: number, totalChunks: number}>}
 */
export async function indexRepository(repoUrl, branch = 'main') {
  // Step 1: Fetch repository tree
  const { owner, repo, branch: resolvedBranch, fileEntries } = await loadRepository(repoUrl, branch);

  // Step 2: Filter relevant source files
  const relevantFiles = filterFiles(fileEntries);

  // Step 3: Fetch content and chunk each file
  const allChunks = [];

  for (const file of relevantFiles) {
    try {
      const content = await fetchFileContent(owner, repo, file.path);
      const chunks = chunkCode(content, file.path, file.language, {
        repoUrl,
        branch: resolvedBranch,
      });
      allChunks.push(...chunks);
    } catch {
      // Skip files that can't be fetched (binary, too large, etc.)
    }
  }

  // Step 4: Generate embeddings
  const texts = allChunks.map((chunk) => chunk.text);
  const embeddings = await embeddingService.generateBatchEmbeddings(texts);

  // Step 5: Store in vector database
  await vectorService.createIndex(allChunks, embeddings);

  return {
    totalFiles: relevantFiles.length,
    totalChunks: allChunks.length,
  };
}
