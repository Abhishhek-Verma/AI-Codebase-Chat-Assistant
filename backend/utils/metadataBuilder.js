/**
 * Metadata Builder
 * 
 * Builds structured metadata objects for code chunks.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Build metadata for a code chunk
 * @param {object} params
 * @param {string} params.file - file path in repo
 * @param {string} params.language - programming language
 * @param {number} params.startLine - start line number
 * @param {number} params.endLine - end line number
 * @param {string} [params.name] - function/class name
 * @param {string} [params.type] - 'function' | 'class' | 'module'
 * @param {string} [params.repoUrl] - repository URL
 * @param {string} [params.branch] - branch name
 * @returns {object} metadata object
 */
export function buildMetadata({
  file,
  language,
  startLine,
  endLine,
  name = '',
  type = 'code',
  repoUrl = '',
  branch = '',
}) {
  return {
    id: uuidv4(),
    file,
    language,
    startLine,
    endLine,
    name,
    type,
    repo: repoUrl,
    branch,
    indexedAt: new Date().toISOString(),
  };
}
