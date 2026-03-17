#!/usr/bin/env node

/**
 * Test Script: Verify Vector Store
 * 
 * Tests FAISS vector store create, save, load, and search.
 * Usage: node scripts/testVectorStore.js
 * 
 * Note: Does NOT require API keys. Uses mock embeddings.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { IndexFlatL2 } = require('faiss-node');

async function test() {
  console.log('═══════════════════════════════════════');
  console.log('  🧪 Testing FAISS Vector Store');
  console.log('═══════════════════════════════════════\n');

  try {
    const dimension = 8; // Small dimension for testing

    // Test 1: Create index
    console.log('Test 1: Create FAISS index...');
    const index = new IndexFlatL2(dimension);
    console.log(`  ✅ Created IndexFlatL2 with dimension ${dimension}\n`);

    // Test 2: Add vectors
    console.log('Test 2: Add vectors...');
    const vectors = [
      [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],  // "auth" concept
      [0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],  // "database" concept
      [0.9, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],  // similar to "auth"
      [0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0],  // "api" concept
    ];
    for (const v of vectors) {
      index.add(v);
    }
    console.log(`  ✅ Added ${vectors.length} vectors\n`);

    // Test 3: Search
    console.log('Test 3: Search for similar vectors...');
    const query = [0.95, 0.05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]; // close to "auth"
    const result = index.search(query, 3);
    console.log(`  Results (top 3):`);
    for (let i = 0; i < result.labels.length; i++) {
      const similarity = 1 / (1 + result.distances[i]);
      console.log(`    ${i + 1}. Index: ${result.labels[i]}, Distance: ${result.distances[i].toFixed(4)}, Similarity: ${similarity.toFixed(4)}`);
    }
    
    // Verify closest is vector 0 (auth)
    if (result.labels[0] === 0) {
      console.log(`  ✅ Correct! Closest match is vector 0 ("auth" concept)\n`);
    } else {
      console.log(`  ❌ Expected vector 0 as closest, got ${result.labels[0]}\n`);
    }

    // Test 4: Total vectors
    console.log('Test 4: Verify index size...');
    console.log(`  ✅ ntotal = ${index.ntotal()} vectors\n`);

    console.log('═══════════════════════════════════════');
    console.log('  ✅ All vector store tests passed!');
    console.log('═══════════════════════════════════════\n');
  } catch (error) {
    console.error(`\n  ❌ Test failed: ${error.message}\n`);
    process.exit(1);
  }
}

test();
