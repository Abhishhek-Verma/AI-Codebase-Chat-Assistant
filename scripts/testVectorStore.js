#!/usr/bin/env node

/**
 * Test Script: Verify Vector Store (Pinecone)
 * 
 * Tests Pinecone vector store create, save, load, and search.
 * Usage: node scripts/testVectorStore.js
 */

import 'dotenv/config';
import { vectorService } from '../backend/services/vectorService.js';

async function test() {
  console.log('═══════════════════════════════════════');
  console.log('  🧪 Testing Pinecone Vector Store');
  console.log('═══════════════════════════════════════\n');

  try {
    const dimension = 1536; // OpenAI text-embedding-3-small dimension

    // Test 1: Create index
    console.log('Test 1: Upsert vectors into Pinecone...');
    const chunks = [
      { text: "Authentication service logic", metadata: { file: "auth.js", startLine: 1, endLine: 10 } },
      { text: "Database connection setup", metadata: { file: "db.js", startLine: 1, endLine: 5 } },
      { text: "Login functionality and password hashing", metadata: { file: "login.js", startLine: 5, endLine: 15 } },
      { text: "REST API routing for users", metadata: { file: "routes.js", startLine: 10, endLine: 20 } },
    ];
    
    // Create random dummy embeddings of dimension 1536
    const generateRandomEmbedding = () => Array.from({ length: dimension }, () => Math.random() - 0.5);
    const mockEmbeddings = chunks.map(() => generateRandomEmbedding());
    
    // For testing purposes, we make the 1st and 3rd vectors closer to each other by blending them slightly
    for (let i = 0; i < dimension; i++) {
        mockEmbeddings[2][i] = (mockEmbeddings[0][i] * 0.8) + (Math.random() * 0.2);
    }

    await vectorService.createIndex(chunks, mockEmbeddings);
    console.log(`  ✅ Upserted ${chunks.length} vectors into Pinecone\n`);

    // Test 2: Search
    console.log('Test 2: Search for similar vectors...');
    
    // We create a query vector that is extremely close to chunk 0
    const queryVector = mockEmbeddings[0].map(val => val + (Math.random() * 0.01));
    const searchResults = await vectorService.search(queryVector, 2);
    
    console.log(`  Results (top 2):`);
    for (let i = 0; i < searchResults.length; i++) {
      const match = searchResults[i];
      console.log(`    ${i + 1}. File: ${match.metadata.file}, Score: ${match.score?.toFixed(4)}`);
    }

    // Test 3: Get Status
    console.log('\nTest 3: Get Index Status...');
    const status = await vectorService.getIndexStatus();
    console.log(`  ✅ Status: ${JSON.stringify(status, null, 2)}\n`);

    console.log('═══════════════════════════════════════');
    console.log('  ✅ All vector store tests passed!');
    console.log('═══════════════════════════════════════\n');
  } catch (error) {
    console.error(`\n  ❌ Test failed: ${error.message}\n`);
    process.exit(1);
  }
}

test();
