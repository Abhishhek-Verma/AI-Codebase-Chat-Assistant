#!/usr/bin/env node

/**
 * CLI Script: Index a GitHub Repository
 * 
 * Usage:
 *   node scripts/indexRepository.js <repoUrl>
 * 
 * Example:
 *   node scripts/indexRepository.js https://github.com/expressjs/express
 */

import 'dotenv/config';
import { indexRepository } from '../backend/rag/indexing/indexRepo.js';

const repoUrl = process.argv[2];

if (!repoUrl) {
  console.error('❌ Usage: node scripts/indexRepository.js <repoUrl>');
  console.error('   Example: node scripts/indexRepository.js https://github.com/user/repo');
  process.exit(1);
}

console.log(`\n🚀 Indexing: ${repoUrl}\n`);

try {
  const result = await indexRepository(repoUrl);
  console.log(`\n✅ Done! ${result.totalFiles} files → ${result.totalChunks} chunks`);
} catch (error) {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
}
