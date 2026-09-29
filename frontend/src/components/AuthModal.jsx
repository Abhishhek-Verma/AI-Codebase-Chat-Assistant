import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User, ArrowRight, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { login, signup, isLoading } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!email.trim() || !password) {
      setAuthError('Please fill in all required fields.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    try {
      if (mode === 'signup') {
        await signup({ name: name.trim(), email: email.trim(), password });
      } else {
        await login({ email: email.trim(), password });
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setAuthError('');
  };

  return (
    <div className="ingest-modal-backdrop" onClick={onClose}>
      <div className="ingest-card auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ingest-card-header">
          <div className="ingest-card-title-group">
            <div className="icon-box-orange">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3>{mode === 'login' ? 'Welcome Back' : 'Create Your Account'}</h3>
              <p>Personalized workspace & private Pinecone vector namespace</p>
            </div>
          </div>
          <button className="btn-close-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tab Toggle: Sign In vs Sign Up */}
        <div className="auth-tab-bar">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            Sign Up
          </button>
        </div>

        {authError && (
          <div className="status-notice status-notice-error" style={{ margin: '14px 24px 0' }}>
            <AlertCircle size={16} />
            <div>
              <p className="notice-title">Authentication Notice</p>
              <p className="notice-sub">{authError}</p>
            </div>
          </div>
        )}

        <div className="auth-modal-body">
          {/* Privacy & Namespace Isolation Banner */}
          <div className="namespace-info-banner">
            <Sparkles size={16} className="text-orange" />
            <div>
              <span className="banner-title">Private Workspace Guarantee:</span>
              <span className="banner-desc">
                {' '}Your indexed repositories, code AST chunks, and chat history are secured inside a dedicated Pinecone namespace (`ns_*`). Only you can view or query your codebase.
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-fields">
            {mode === 'signup' && (
              <div className="auth-input-group">
                <label>
                  <User size={13} />
                  <span>Full Name</span>
                </label>
                <div className="auth-input-wrapper">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Abhishek Verma"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div className="auth-input-group">
              <label>
                <Mail size={13} />
                <span>Email Address</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label>
                <Lock size={13} />
                <span>Password</span>
              </label>
              <div className="auth-input-wrapper">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button type="submit" className="btn-auth-submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Free Account' : 'Sign In'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Switch mode footer */}
          <div className="auth-switch-footer">
            {mode === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button type="button" className="auth-switch-link" onClick={() => switchMode('signup')}>
                  Create an account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button type="button" className="auth-switch-link" onClick={() => switchMode('login')}>
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
