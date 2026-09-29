import React from 'react';
import { Sparkles, Check, Zap, ArrowRight, BookOpen } from 'lucide-react';

/**
 * HeroHeader - Matches the NextStepAI editorial headline and pill design
 */
export default function HeroHeader({ onStartClick, onExploreClick }) {
  return (
    <section className="hero-section">
      {/* Top Feature Badges */}
      <div className="hero-pill-badges">
        <span className="pill-badge pill-ai">
          <Sparkles size={13} className="pill-icon-orange" />
          <span>AI Powered</span>
        </span>
        <span className="pill-badge pill-feature">
          <Check size={13} className="pill-icon-orange" />
          <span>Codebase RAG</span>
        </span>
        <span className="pill-badge pill-speed">
          <Zap size={13} className="pill-icon-orange" />
          <span>Groq Ultra-Fast</span>
        </span>
      </div>

      {/* Main Headline */}
      <h1 className="hero-title">
        <span className="hero-line">Your Intelligent</span>
        <span className="hero-line hero-line-bold">Codebase</span>
        <span className="hero-line hero-line-italic">Architecture.</span>
      </h1>

      {/* Subtitle */}
      <p className="hero-subtitle">
        AI-powered code intelligence that analyzes your repository structure, AST syntax trees, and documentation to create your perfect interactive technical companion.
      </p>

      {/* CTA Buttons */}
      <div className="hero-actions">
        <button className="btn-hero-primary" onClick={onStartClick}>
          <span>Get Started Free</span>
          <ArrowRight size={16} />
        </button>
        <button className="btn-hero-secondary" onClick={onExploreClick}>
          <BookOpen size={16} />
          <span>See How It Works</span>
        </button>
      </div>
    </section>
  );
}
