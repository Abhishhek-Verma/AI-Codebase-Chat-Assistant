/**
 * Code Chunker
 * 
 * Splits source code files into meaningful chunks using Tree-sitter AST parsing.
 * Falls back to line-based splitting for unparseable files.
 * 
 * Target chunk size: 300-500 tokens (~1200-2000 characters)
 * Overlap: 50 tokens (~200 characters)
 */

import { buildMetadata } from '../../utils/metadataBuilder.js';

// Approximate token count (1 token ≈ 4 chars for code)
const CHARS_PER_TOKEN = 4;
const MIN_CHUNK_CHARS = 300 * CHARS_PER_TOKEN;  // ~1200 chars
const MAX_CHUNK_CHARS = 500 * CHARS_PER_TOKEN;  // ~2000 chars
const OVERLAP_CHARS = 50 * CHARS_PER_TOKEN;     // ~200 chars

/**
 * Chunk a source code file into meaningful pieces
 * @param {string} content - file content
 * @param {string} filePath - file path in repo
 * @param {string} language - programming language
 * @param {object} repoInfo - { repoUrl, branch }
 * @returns {Array<{text: string, metadata: object}>} chunks with metadata
 */
export function chunkCode(content, filePath, language, repoInfo = {}) {
  if (!content || content.trim().length === 0) {
    return [];
  }

  // For now, use line-based splitting with smart boundaries
  // TODO: Integrate Tree-sitter AST parsing in Module 4 enhancement
  const chunks = splitByFunctions(content, filePath, language, repoInfo);

  return chunks;
}

/**
 * Split code by function/class boundaries using regex patterns
 * Falls back to fixed-size splitting if no boundaries found
 */
function splitByFunctions(content, filePath, language, repoInfo) {
  const lines = content.split('\n');
  const chunks = [];

  // Try to find function/class boundaries
  const boundaries = findBoundaries(lines, language);

  if (boundaries.length > 0) {
    // Split at detected boundaries
    for (let i = 0; i < boundaries.length; i++) {
      const start = boundaries[i];
      const end = i < boundaries.length - 1 ? boundaries[i + 1] - 1 : lines.length - 1;
      const chunkText = lines.slice(start, end + 1).join('\n');

      if (chunkText.trim().length > 0) {
        // If chunk is too large, sub-split it
        if (chunkText.length > MAX_CHUNK_CHARS) {
          const subChunks = fixedSizeSplit(chunkText, start);
          for (const sub of subChunks) {
            chunks.push({
              text: sub.text,
              metadata: buildMetadata({
                file: filePath,
                language,
                startLine: sub.startLine,
                endLine: sub.endLine,
                ...repoInfo,
              }),
            });
          }
        } else {
          chunks.push({
            text: chunkText,
            metadata: buildMetadata({
              file: filePath,
              language,
              startLine: start + 1,
              endLine: end + 1,
              ...repoInfo,
            }),
          });
        }
      }
    }
  } else {
    // No boundaries found — use fixed-size splitting
    const subChunks = fixedSizeSplit(content, 0);
    for (const sub of subChunks) {
      chunks.push({
        text: sub.text,
        metadata: buildMetadata({
          file: filePath,
          language,
          startLine: sub.startLine,
          endLine: sub.endLine,
          ...repoInfo,
        }),
      });
    }
  }

  return chunks;
}

/**
 * Find function/class boundaries in code
 * @param {string[]} lines
 * @param {string} language
 * @returns {number[]} array of line indices where boundaries occur
 */
function findBoundaries(lines, language) {
  const boundaries = [0]; // Always start with line 0
  const patterns = getBoundaryPatterns(language);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (patterns.some((pattern) => pattern.test(line))) {
      boundaries.push(i);
    }
  }

  return boundaries;
}

/**
 * Get regex patterns for function/class boundaries by language
 */
function getBoundaryPatterns(language) {
  const common = [
    /^(export\s+)?(async\s+)?function\s+\w+/,       // function declarations
    /^(export\s+)?(default\s+)?class\s+\w+/,         // class declarations
    /^(export\s+)?const\s+\w+\s*=\s*(async\s+)?\(/, // arrow functions
    /^(export\s+)?const\s+\w+\s*=\s*(async\s+)?function/, // const function
  ];

  const languagePatterns = {
    javascript: common,
    typescript: [
      ...common,
      /^(export\s+)?(abstract\s+)?class\s+\w+/,
      /^(export\s+)?interface\s+\w+/,
      /^(export\s+)?type\s+\w+/,
      /^(export\s+)?enum\s+\w+/,
    ],
    python: [
      /^(async\s+)?def\s+\w+/,
      /^class\s+\w+/,
    ],
    java: [
      /^\s*(public|private|protected)?\s*(static\s+)?(class|interface|enum)\s+\w+/,
      /^\s*(public|private|protected)?\s*(static\s+)?([\w<>[\]]+)\s+\w+\s*\(/,
    ],
    go: [
      /^func\s+/,
      /^type\s+\w+\s+(struct|interface)/,
    ],
  };

  return languagePatterns[language] || common;
}

/**
 * Fixed-size splitting with overlap
 * @param {string} text
 * @param {number} baseLineOffset
 * @returns {Array<{text: string, startLine: number, endLine: number}>}
 */
function fixedSizeSplit(text, baseLineOffset) {
  const chunks = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    let chunkLines = [];
    let charCount = 0;

    while (i < lines.length && charCount < MAX_CHUNK_CHARS) {
      chunkLines.push(lines[i]);
      charCount += lines[i].length + 1; // +1 for newline
      i++;
    }

    if (chunkLines.length > 0) {
      chunks.push({
        text: chunkLines.join('\n'),
        startLine: baseLineOffset + (i - chunkLines.length) + 1,
        endLine: baseLineOffset + i,
      });
    }

    // Overlap: go back a few lines
    if (i < lines.length) {
      const overlapLines = Math.floor(OVERLAP_CHARS / 80); // ~80 chars per line avg
      i = Math.max(i - overlapLines, i - chunkLines.length + 1);
    }
  }

  return chunks;
}
