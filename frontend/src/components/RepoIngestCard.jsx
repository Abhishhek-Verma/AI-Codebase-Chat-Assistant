import React, { useState } from 'react';
import { GitBranch, Database, Loader2, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { indexRepository } from '../services/api';

/**
 * RepoIngestCard - Clean glass card for configuring and indexing GitHub repositories
 */
export default function RepoIngestCard({ isOpen, onClose, indexStatus, onIndexed }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestError, setIngestError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim() || isIngesting) return;

    setIsIngesting(true);
    setIngestError('');
    setSuccessMsg('');

    let result;
    try {
      result = await indexRepository(repoUrl.trim());
      setSuccessMsg(`Successfully indexed ${result.totalFiles} files into ${result.totalChunks} chunks!`);
      setRepoUrl('');
    } catch (error) {
      setIngestError(error.message || 'Failed to index repository');
      return;
    } finally {
      setIsIngesting(false);
    }

    if (result && onIndexed) {
      onIndexed({
        indexed: true,
        totalChunks: result.totalChunks,
        repo: result.repo,
      });
    }
  };

  return (
    <div className="ingest-modal-backdrop" onClick={onClose}>
      <div className="ingest-card" onClick={(e) => e.stopPropagation()}>
        <div className="ingest-card-header">
          <div className="ingest-card-title-group">
            <div className="icon-box-orange">
              <Database size={18} />
            </div>
            <div>
              <h3>Index GitHub Repository</h3>
              <p>Extract AST chunks, generate vector embeddings, and store in Pinecone</p>
            </div>
          </div>
          <button className="btn-close-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleIngest} className="ingest-card-form">
          <div className="input-group">
            <label>
              <GitBranch size={13} />
              <span>Repository URL</span>
            </label>
            <div className="input-field-wrapper">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/facebook/react or https://github.com/expressjs/express"
                disabled={isIngesting}
              />
              <button
                type="submit"
                className="btn-card-submit"
                disabled={!repoUrl.trim() || isIngesting}
              >
                {isIngesting ? (
                  <>
                    <Loader2 size={15} className="spinner" />
                    <span>Indexing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Index Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Statuses */}
        {isIngesting && (
          <div className="status-notice status-notice-loading">
            <Loader2 size={16} className="spinner" />
            <div>
              <p className="notice-title">Pipeline Running</p>
              <p className="notice-sub">Fetching repository tree, chunking functions/classes, and syncing vectors...</p>
            </div>
          </div>
        )}

        {ingestError && (
          <div className="status-notice status-notice-error">
            <AlertCircle size={16} />
            <div>
              <p className="notice-title">Indexing Error</p>
              <p className="notice-sub">{ingestError}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="status-notice status-notice-success">
            <CheckCircle2 size={16} />
            <div>
              <p className="notice-title">Ready for Queries</p>
              <p className="notice-sub">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Current status display */}
        <div className="current-status-box">
          <div className="status-row">
            <span className="status-label">Current Status:</span>
            <span className={`status-badge-pill ${indexStatus?.indexed ? 'badge-indexed' : 'badge-idle'}`}>
              {indexStatus?.indexed ? '✓ Repository Active' : 'No Repo Indexed'}
            </span>
          </div>
          {indexStatus?.indexed && (
            <div className="status-meta">
              <span>{indexStatus.totalChunks || 0} code chunks vectorized</span>
              {indexStatus.repo && <span className="repo-name">· {indexStatus.repo}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
