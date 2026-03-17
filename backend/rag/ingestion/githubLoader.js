/**
 * GitHub Loader
 *
 * Fetches all source files from a GitHub repository using the GitHub API.
 * Supports recursive directory traversal and Base64 content decoding.
 */

import { Octokit } from 'octokit';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * Parse GitHub URL into owner and repo
 * @param {string} repoUrl - e.g., "https://github.com/user/project"
 * @returns {{owner: string, repo: string}}
 */
function parseGitHubUrl(repoUrl) {
  const match = repoUrl.match(/github\.com\/([\w.-]+)\/([\w.-]+)/);
  if (!match) throw new Error(`Invalid GitHub URL: ${repoUrl}`);
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

/**
 * Fetch all files from a GitHub repository recursively
 * @param {string} repoUrl
 * @param {string} branch - default: "main"
 * @returns {Promise<{owner, repo, branch, fileEntries}>}
 */
export async function loadRepository(repoUrl, branch = 'main') {
  const { owner, repo } = parseGitHubUrl(repoUrl);

  let tree;
  try {
    const response = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: 'true',
    });
    tree = response.data.tree;
  } catch (err) {
    // If "main" fails, try "master"
    if (branch === 'main') {
      return loadRepository(repoUrl, 'master');
    }
    throw err;
  }

  const fileEntries = tree.filter((item) => item.type === 'blob');
  return { owner, repo, branch, fileEntries };
}

/**
 * Fetch the content of a single file
 * @param {string} owner
 * @param {string} repo
 * @param {string} path
 * @returns {Promise<string>} decoded file content
 */
export async function fetchFileContent(owner, repo, path) {
  const response = await octokit.rest.repos.getContent({ owner, repo, path });
  return Buffer.from(response.data.content, 'base64').toString('utf-8');
}
