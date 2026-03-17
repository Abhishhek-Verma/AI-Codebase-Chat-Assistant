#!/usr/bin/env node

/**
 * Test Script: Verify Ingestion Pipeline
 * 
 * Tests the ingestion pipeline with a small public repo.
 * Usage: node scripts/testIngestion.js
 * 
 * Requires: GITHUB_TOKEN in .env (optional but recommended for rate limits)
 */

import 'dotenv/config';
import { loadRepository, fetchFileContent } from '../backend/rag/ingestion/githubLoader.js';
import { filterFiles } from '../backend/rag/ingestion/fileParser.js';
import { chunkCode } from '../backend/rag/chunking/chunkCode.js';

const TEST_REPO = 'https://github.com/expressjs/express';

async function test() {
  console.log('═══════════════════════════════════════');
  console.log('  🧪 Testing Ingestion Pipeline');
  console.log('═══════════════════════════════════════\n');

  try {
    // Test 1: Load repository
    console.log('Test 1: Load repository tree...');
    const { owner, repo, branch, fileEntries } = await loadRepository(TEST_REPO);
    console.log(`  ✅ Loaded ${fileEntries.length} files from ${owner}/${repo} (${branch})\n`);

    // Test 2: Filter files
    console.log('Test 2: Filter relevant files...');
    const relevant = filterFiles(fileEntries);
    console.log(`  ✅ Filtered to ${relevant.length} relevant files`);
    console.log(`  Sample: ${relevant.slice(0, 5).map(f => f.path).join(', ')}\n`);

    // Test 3: Fetch file content
    console.log('Test 3: Fetch file content...');
    const firstFile = relevant[0];
    const content = await fetchFileContent(owner, repo, firstFile.path);
    console.log(`  ✅ Fetched ${firstFile.path} (${content.length} chars)\n`);

    // Test 4: Chunk code
    console.log('Test 4: Chunk code...');
    const chunks = chunkCode(content, firstFile.path, firstFile.language, {
      repoUrl: TEST_REPO,
      branch,
    });
    console.log(`  ✅ Created ${chunks.length} chunks`);
    if (chunks.length > 0) {
      console.log(`  First chunk metadata:`, JSON.stringify(chunks[0].metadata, null, 2));
      console.log(`  First chunk text (first 100 chars): "${chunks[0].text.substring(0, 100)}..."`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log('  ✅ All ingestion tests passed!');
    console.log('═══════════════════════════════════════\n');
  } catch (error) {
    console.error(`\n  ❌ Test failed: ${error.message}\n`);
    process.exit(1);
  }
}

test();
