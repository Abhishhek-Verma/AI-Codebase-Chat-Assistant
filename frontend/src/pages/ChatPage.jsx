import React, { useState, useEffect } from 'react';
import ChatBox from '../components/ChatBox';
import { indexRepository, getRepoStatus } from '../services/api';
import {
  Code2,
  GitBranch,
  Database,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

/**
 * ChatPage - main page layout with sidebar + chat area
 */
export default function ChatPage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [indexStatus, setIndexStatus] = useState(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestError, setIngestError] = useState('');

  // Check index status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const status = await getRepoStatus();
      setIndexStatus(status);
    } catch {
      setIndexStatus({ indexed: false });
    }
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim() || isIngesting) return;

    setIsIngesting(true);
    setIngestError('');

    try {
      const result = await indexRepository(repoUrl.trim());
      setIndexStatus({
        indexed: true,
        totalChunks: result.totalChunks,
        repo: result.repo,
      });
      setRepoUrl('');
    } catch (error) {
      setIngestError(error.message);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>
            <Code2 size={20} />
            Codebase RAG
          </h1>
          <p>AI-powered code assistant</p>
        </div>

        <div className="sidebar-content">
          {/* Ingest Form */}
          <form className="ingest-form" onSubmit={handleIngest}>
            <label>
              <GitBranch size={12} style={{ display: 'inline', marginRight: '4px' }} />
              GitHub Repository
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              disabled={isIngesting}
            />
            <button
              type="submit"
              className="btn-ingest"
              disabled={!repoUrl.trim() || isIngesting}
            >
              {isIngesting ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Indexing...
                </>
              ) : (
                <>
                  <Database size={16} />
                  Index Repository
                </>
              )}
            </button>
          </form>

          {/* Error */}
          {ingestError && (
            <div className="index-status not-indexed" style={{ marginTop: '12px' }}>
              <div className="status-label">
                <AlertCircle size={14} />
                Error
              </div>
              <div className="status-detail">{ingestError}</div>
            </div>
          )}

          {/* Status */}
          {isIngesting && (
            <div className="index-status loading">
              <div className="status-label">
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Processing...
              </div>
              <div className="status-detail">
                Fetching files, parsing code, generating embeddings...
              </div>
            </div>
          )}

          {indexStatus?.indexed && !isIngesting && (
            <div className="index-status indexed">
              <div className="status-label">
                <CheckCircle2 size={14} />
                Repository Indexed
              </div>
              <div className="status-detail">
                {indexStatus.totalChunks} chunks indexed
                {indexStatus.repo && (
                  <span style={{ display: 'block', marginTop: '2px' }}>
                    {indexStatus.repo}
                  </span>
                )}
              </div>
            </div>
          )}

          {indexStatus && !indexStatus.indexed && !isIngesting && (
            <div className="index-status not-indexed">
              <div className="status-label">
                <AlertCircle size={14} />
                No Repository Indexed
              </div>
              <div className="status-detail">
                Enter a GitHub URL above to get started.
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <ChatBox isIndexed={indexStatus?.indexed || false} />
    </div>
  );
}
