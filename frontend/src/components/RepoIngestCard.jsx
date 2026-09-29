import React, { useState } from 'react';
import { GitBranch, Database, Loader2, CheckCircle2, AlertCircle, X, Sparkles, Shield, Check, ArrowRight, LogIn } from 'lucide-react';
import { indexRepository } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RepoIngestCard({ isOpen, onClose, indexStatus, onIndexed, onOpenAuth }) {
  const { user, isAuthenticated, repos, activeRepo, selectRepo, updateRepoData } = useAuth();
  const [repoUrl, setRepoUrl] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestError, setIngestError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [switchingRepo, setSwitchingRepo] = useState('');

  if (!isOpen) return null;

  const handleIngest = async (e) => {
    e.preventDefault();

    // Compulsory Google Login requirement!
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!repoUrl.trim() || isIngesting) return;

    setIsIngesting(true);
    setIngestError('');
    setSuccessMsg('');

    let result;
    try {
      result = await indexRepository(repoUrl.trim());
      setSuccessMsg(`Successfully indexed ${result.totalFiles} files into ${result.totalChunks} chunks in your private namespace!`);
      setRepoUrl('');

      // Update repo list in auth context
      const newEntry = {
        repoUrl: result.repo,
        totalFiles: result.totalFiles,
        totalChunks: result.totalChunks,
        indexedAt: new Date().toISOString(),
      };
      const updatedRepos = [newEntry, ...(repos.filter((r) => r.repoUrl !== result.repo))];
      updateRepoData(updatedRepos, newEntry);
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

  const handleSwitchRepo = async (targetRepoUrl) => {
    if (switchingRepo || targetRepoUrl === activeRepo?.repoUrl) return;
    setSwitchingRepo(targetRepoUrl);
    try {
      const res = await selectRepo(targetRepoUrl);
      if (onIndexed) {
        onIndexed({
          indexed: true,
          totalChunks: res.totalChunks || activeRepo?.totalChunks || 0,
          repo: targetRepoUrl,
        });
      }
    } catch (err) {
      setIngestError(err.message || 'Failed to switch repository');
    } finally {
      setSwitchingRepo('');
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

        {/* Namespace privacy pill or Login Required Notice */}
        {isAuthenticated ? (
          <div className="card-namespace-indicator">
            <Shield size={13} className="text-orange" />
            <span>
              Active Namespace: <strong>{user?.namespace}</strong> ({user?.name || user?.email})
            </span>
          </div>
        ) : (
          <div className="auth-required-banner" onClick={onOpenAuth} role="button" tabIndex={0}>
            <LogIn size={15} className="text-orange" />
            <div className="auth-required-text">
              <span className="banner-title">Authentication Required:</span>
              <span className="banner-sub"> Please sign in or create an account to index repositories and save them permanently to your workspace.</span>
            </div>
            <button type="button" className="btn-banner-login" onClick={onOpenAuth}>
              Sign In / Sign Up
            </button>
          </div>
        )}

        {/* Previous Repositories List */}
        {isAuthenticated && repos && repos.length > 0 && (
          <div className="previous-repos-container">
            <label className="section-mini-label">Your Indexed Repositories (Switch Anytime without Re-indexing)</label>
            <div className="previous-repos-list">
              {repos.map((r) => {
                const isActive = activeRepo?.repoUrl === r.repoUrl || indexStatus?.repo === r.repoUrl;
                const repoShortName = r.repoUrl.replace('https://github.com/', '');
                return (
                  <div
                    key={r.repoUrl}
                    className={`prev-repo-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSwitchRepo(r.repoUrl)}
                  >
                    <div className="prev-repo-left">
                      <GitBranch size={14} className={isActive ? 'text-orange' : 'text-muted'} />
                      <div className="prev-repo-details">
                        <span className="prev-repo-name">{repoShortName}</span>
                        <span className="prev-repo-meta">
                          {r.totalChunks || 0} chunks · {r.totalFiles || 0} files
                        </span>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="badge-active-tag">
                        <Check size={12} /> Active
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-switch-repo"
                        disabled={switchingRepo === r.repoUrl}
                      >
                        {switchingRepo === r.repoUrl ? (
                          <Loader2 size={12} className="spinner" />
                        ) : (
                          <>
                            <span>Select</span>
                            <ArrowRight size={12} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleIngest} className="ingest-card-form">
          <div className="input-group">
            <label>
              <GitBranch size={13} />
              <span>{repos?.length > 0 ? 'Index Another Repository' : 'Repository URL'}</span>
            </label>
            <div className="input-field-wrapper">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/facebook/react or https://github.com/expressjs/express"
                disabled={isIngesting || !isAuthenticated}
              />
              <button
                type="submit"
                className="btn-card-submit"
                disabled={isIngesting || (!isAuthenticated && false)}
              >
                {isIngesting ? (
                  <>
                    <Loader2 size={15} className="spinner" />
                    <span>Indexing...</span>
                  </>
                ) : !isAuthenticated ? (
                  <>
                    <LogIn size={15} />
                    <span>Sign In to Index</span>
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
              <p className="notice-sub">Fetching repository tree, chunking AST nodes, and syncing vectors to your permanent Pinecone namespace...</p>
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
