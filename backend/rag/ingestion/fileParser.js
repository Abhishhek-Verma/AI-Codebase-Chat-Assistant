/**
 * File Parser
 * 
 * Filters files by extension, ignores irrelevant paths,
 * and detects the programming language from file extension.
 */

// Supported file extensions
const ALLOWED_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx',
  '.py',
  '.java',
  '.go',
  '.rs',
  '.rb',
  '.php',
  '.c', '.cpp', '.h',
  '.cs',
  '.md',
  '.json',
  '.yaml', '.yml',
];

// Paths to ignore
const IGNORE_PATTERNS = [
  'node_modules/',
  'dist/',
  'build/',
  '.next/',
  '__pycache__/',
  '.git/',
  'vendor/',
  'coverage/',
  '.min.js',
  '.min.css',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

// Max file size (skip files larger than 100KB)
const MAX_FILE_SIZE = 100 * 1024;

// Extension → language mapping
const LANGUAGE_MAP = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.php': 'php',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.cs': 'csharp',
  '.md': 'markdown',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
};

/**
 * Check if a file path should be included
 * @param {string} path
 * @param {number} size - file size in bytes
 * @returns {boolean}
 */
export function shouldIncludeFile(path, size = 0) {
  // Check ignore patterns
  if (IGNORE_PATTERNS.some((pattern) => path.includes(pattern))) {
    return false;
  }

  // Check file size
  if (size > MAX_FILE_SIZE) {
    return false;
  }

  // Check extension
  const ext = getExtension(path);
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Get file extension from path
 * @param {string} path
 * @returns {string}
 */
function getExtension(path) {
  const lastDot = path.lastIndexOf('.');
  if (lastDot === -1) return '';
  return path.slice(lastDot).toLowerCase();
}

/**
 * Detect programming language from file path
 * @param {string} path
 * @returns {string}
 */
export function detectLanguage(path) {
  const ext = getExtension(path);
  return LANGUAGE_MAP[ext] || 'unknown';
}

/**
 * Filter an array of file entries to only include relevant source files
 * @param {Array<{path: string, size: number}>} fileEntries
 * @returns {Array<{path: string, size: number, language: string}>}
 */
export function filterFiles(fileEntries) {
  return fileEntries
    .filter((entry) => shouldIncludeFile(entry.path, entry.size))
    .map((entry) => ({
      ...entry,
      language: detectLanguage(entry.path),
    }));
}
