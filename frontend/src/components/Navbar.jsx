import React from 'react';
import { GitBranch, Zap, Sparkles } from 'lucide-react';

/**
 * Navbar - Floating frosted pill navigation matching the NextStepAI design
 */
export default function Navbar({ onOpenIngest, isIndexed, totalChunks }) {
  return (
    <header className="navbar-container">
      <nav className="floating-navbar">
        {/* Logo */}
        <div className="nav-brand">
          <div className="brand-badge">
            <span className="brand-dot"></span>
            <Sparkles size={16} className="brand-sparkle" />
          </div>
          <div className="brand-text">
            <span className="brand-title">AI Codebase</span>
            <span className="brand-accent">Assistant</span>
          </div>
        </div>

        {/* Center links */}
        <div className="nav-links">
          <a
            href="#how-it-works"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            How It Works
          </a>
          <a
            href="#features"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Features
          </a>
          <a
            href="#architecture"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Architecture
          </a>
          <div className="groq-pill-badge">
            <Zap size={13} className="text-orange" />
            <span>Groq LPU Engine</span>
          </div>
        </div>

        {/* Right CTA */}
        <div className="nav-actions">
          <div className="status-indicator-badge">
            <span className={`status-dot ${isIndexed ? 'active' : 'idle'}`}></span>
            <span className="status-text">
              {isIndexed ? `${totalChunks || 0} Chunks Indexed` : 'Pinecone Ready'}
            </span>
          </div>
          <button className="btn-nav-primary" onClick={onOpenIngest}>
            <GitBranch size={14} />
            <span>{isIndexed ? 'Manage Repo' : 'Index Repo'}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
