import React, { useEffect, useRef, useState } from 'react';
import { X, ShieldCheck, UserCheck, Sparkles, AlertCircle, LogIn, Laptop, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { loginWithGoogle, loginAsDemo, isLoading } = useAuth();
  const [authError, setAuthError] = useState('');
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Initialize Google One Tap / Button if GSI is available and client id configured
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (window.google?.accounts?.id && clientId && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response.credential) {
              try {
                await loginWithGoogle(response.credential);
                onClose();
                if (onSuccess) onSuccess();
              } catch (err) {
                setAuthError(err.message || 'Google authentication failed');
              }
            }
          },
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          shape: 'pill',
        });
      } catch (err) {
        console.warn('GSI render error:', err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDemoSelect = async (demoType) => {
    setAuthError('');
    try {
      await loginAsDemo(demoType);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setAuthError(err.message || 'Failed to sign in to demo profile');
    }
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
              <h3>Private Workspace Access</h3>
              <p>Sign in to isolate your vector database chunks & query history</p>
            </div>
          </div>
          <button className="btn-close-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {authError && (
          <div className="status-notice status-notice-error" style={{ margin: '16px 24px 0' }}>
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
              <span className="banner-title">Multi-Tenant Namespace Guarantee:</span>
              <span className="banner-desc">
                {' '}Every user receives a unique Pinecone namespace. Your indexed codebases, AST chunks, and LLM conversations are strictly confidential and completely hidden from other visitors.
              </span>
            </div>
          </div>

          {/* Section 1: Google Sign In */}
          <div className="auth-section">
            <label className="auth-section-label">Sign in with Google</label>
            <div ref={googleBtnRef} className="google-btn-wrapper"></div>
            {/* Fallback button if Google client ID isn't configured in .env yet */}
            {(!import.meta.env.VITE_GOOGLE_CLIENT_ID || !window.google?.accounts?.id) && (
              <button
                type="button"
                className="btn-google-simulated"
                onClick={() => handleDemoSelect('lead_dev')}
                disabled={isLoading}
              >
                <svg className="google-icon-svg" viewBox="0 0 24 24">
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
                <span>Continue with Google Account</span>
              </button>
            )}
          </div>

          <div className="auth-divider">
            <span>OR INSTANT INTERVIEW DEMO PROFILES</span>
          </div>

          {/* Section 2: 1-Click Demo Profiles */}
          <div className="auth-section">
            <p className="demo-profiles-sub">
              Evaluate multi-tenancy immediately. Each profile operates in its own isolated Pinecone namespace.
            </p>

            <div className="demo-profiles-grid">
              <button
                type="button"
                className="demo-profile-card highlight"
                onClick={() => handleDemoSelect('candidate_reviewer')}
                disabled={isLoading}
              >
                <div className="profile-card-left">
                  <div className="avatar-chip reviewer">
                    <UserCheck size={18} />
                  </div>
                  <div className="profile-info">
                    <span className="profile-name">Technical Interviewer</span>
                    <span className="profile-role">reviewer@enterprise.ai · Clean Namespace</span>
                  </div>
                </div>
                <div className="badge-fast-tag">Instant Login</div>
              </button>

              <button
                type="button"
                className="demo-profile-card"
                onClick={() => handleDemoSelect('lead_dev')}
                disabled={isLoading}
              >
                <div className="profile-card-left">
                  <div className="avatar-chip lead">
                    <Laptop size={18} />
                  </div>
                  <div className="profile-info">
                    <span className="profile-name">Abhishek Verma</span>
                    <span className="profile-role">abhishek.verma@codebase.ai · Lead Dev</span>
                  </div>
                </div>
                <LogIn size={15} className="text-muted" />
              </button>

              <button
                type="button"
                className="demo-profile-card"
                onClick={() => handleDemoSelect('guest_developer')}
                disabled={isLoading}
              >
                <div className="profile-card-left">
                  <div className="avatar-chip guest">
                    <Terminal size={18} />
                  </div>
                  <div className="profile-info">
                    <span className="profile-name">Guest Developer</span>
                    <span className="profile-role">guest.dev@codebase.ai · Sandbox</span>
                  </div>
                </div>
                <LogIn size={15} className="text-muted" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
