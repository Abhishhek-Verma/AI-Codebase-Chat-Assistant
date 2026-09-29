import React, { useState, useRef, useEffect } from 'react';
import { GitBranch, Zap, Sparkles, User, LogOut, ChevronDown, Shield, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenIngest, onOpenAuth, isIndexed, totalChunks, activeRepoName }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="navbar-container">
      <nav className="floating-navbar">
        {/* Brand / Home Link */}
        <a
          href="/"
          className="nav-brand"
          title="Return to Home"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (window.location.hash || window.location.pathname !== '/') {
              window.history.pushState(null, '', '/');
            }
          }}
        >
          <div className="brand-badge">
            <span className="brand-dot"></span>
            <Sparkles size={16} className="brand-sparkle" />
          </div>
          <div className="brand-text">
            <span className="brand-title">AI Codebase</span>
            <span className="brand-accent">Assistant</span>
          </div>
        </a>

        {/* Center Navigation Links */}
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

        {/* Right Actions & User Profile */}
        <div className="nav-actions">
          {/* Index Status Badge */}
          <div className="status-indicator-badge">
            <span className={`status-dot ${isIndexed ? 'active' : 'idle'}`}></span>
            <span className="status-text">
              {isIndexed
                ? `${totalChunks || 0} Chunks${activeRepoName ? ` · ${activeRepoName.split('/').slice(-1)[0]}` : ''}`
                : 'No Repo Active'}
            </span>
          </div>

          {/* Index Button */}
          <button className="btn-nav-primary" onClick={onOpenIngest}>
            <GitBranch size={14} />
            <span>{isIndexed ? 'Manage Repo' : 'Index Repo'}</span>
          </button>

          {/* User Account / Sign In */}
          {isAuthenticated ? (
            <div className="user-profile-menu-wrapper" ref={dropdownRef}>
              <button
                className="user-profile-button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                title="Account & Namespace"
              >
                {user?.picture ? (
                  <img src={user.picture} alt={user.name || 'User'} className="user-avatar-img" />
                ) : (
                  <div className="user-avatar-placeholder">
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="user-name-label">{user?.name?.split(' ')[0] || 'User'}</span>
                <ChevronDown size={14} className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-header">
                    <p className="dropdown-name">{user?.name || 'Developer'}</p>
                    <p className="dropdown-email">{user?.email || 'user@codebase.ai'}</p>
                    <div className="dropdown-namespace-tag">
                      <Shield size={12} className="text-orange" />
                      <span>Namespace: {user?.namespace || 'ns_private'}</span>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenIngest();
                    }}
                  >
                    <GitBranch size={15} />
                    <span>Manage Repositories</span>
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                      onOpenAuth();
                    }}
                  >
                    <User size={15} />
                    <span>Switch Google Account</span>
                  </button>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item text-danger"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-nav-auth" onClick={onOpenAuth}>
              <svg className="google-nav-icon" viewBox="0 0 24 24" width="14" height="14">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
