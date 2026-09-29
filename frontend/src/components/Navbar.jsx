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
                    <span>Switch Account</span>
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
              <User size={14} />
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
