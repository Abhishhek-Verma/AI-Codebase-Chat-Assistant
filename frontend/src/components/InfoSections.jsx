import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  GitBranch,
  Database,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCode,
  Zap,
  Repeat,
  Code2,
  Terminal,
  Activity,
  CheckCircle2
} from 'lucide-react';

/**
 * InfoSections - Interactive How It Works, Features, and Architecture components
 * matching the NextStepAI aesthetic
 */
export default function InfoSections({ onOpenIngest }) {
  const [activeTab, setActiveTab] = useState('architecture');

  return (
    <div className="info-sections-container">
      {/* Tab Switcher Pills */}
      <div className="section-tab-nav">
        <button
          className={`tab-pill-btn ${activeTab === 'architecture' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('architecture');
            document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <Layers size={15} />
          <span>Architecture</span>
        </button>
        <button
          className={`tab-pill-btn ${activeTab === 'how-it-works' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('how-it-works');
            document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <GitBranch size={15} />
          <span>How It Works</span>
        </button>
        <button
          className={`tab-pill-btn ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('features');
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <Zap size={15} />
          <span>Features</span>
        </button>
      </div>

      {/* ── Architecture Section ──────────────────────────────── */}
      <section id="architecture" className="info-section-card">
        <div className="section-badge-pill">
          <Layers size={13} className="text-orange" />
          <span>System Design</span>
        </div>
        <h2 className="section-editorial-title">
          End-to-End <span className="title-italic-orange">Architecture.</span>
        </h2>
        <p className="section-editorial-sub">
          A high-throughput Retrieval-Augmented Generation pipeline built with Octokit, Pinecone Vector DB, and Groq's high-speed inference engine.
        </p>

        {/* Visual Architecture Diagram */}
        <div className="architecture-diagram-flow">
          {/* Row 1: Client & API */}
          <div className="arch-flow-stage">
            <div className="stage-header">
              <span className="stage-num">01</span>
              <h4>Client & Streaming Gateway</h4>
            </div>
            <div className="stage-boxes-grid">
              <div className="arch-box">
                <div className="arch-box-icon">
                  <Terminal size={18} />
                </div>
                <h5>React 19 Frontend</h5>
                <p>Vite + Tailwind/CSS, EventSource SSE streaming token consumer</p>
                <span className="tech-tag">React 19</span>
              </div>
              <div className="arch-box arch-box-accent">
                <div className="arch-box-icon icon-orange">
                  <Activity size={18} />
                </div>
                <h5>Express.js API Router</h5>
                <p>RESTful controllers, SSE response headers, CORS & health checks</p>
                <span className="tech-tag">Express 4.21</span>
              </div>
            </div>
          </div>

          <div className="flow-connector-line">
            <ArrowRight size={18} className="connector-arrow" />
          </div>

          {/* Row 2: Ingestion & Vector Storage */}
          <div className="arch-flow-stage">
            <div className="stage-header">
              <span className="stage-num">02</span>
              <h4>RAG Ingestion & Vector Storage</h4>
            </div>
            <div className="stage-boxes-grid">
              <div className="arch-box">
                <div className="arch-box-icon">
                  <GitBranch size={18} />
                </div>
                <h5>GitHub Ingestion & AST</h5>
                <p>Octokit repo tree loader, language filtering, AST function/class chunker</p>
                <span className="tech-tag">Tree-sitter / Regex</span>
              </div>
              <div className="arch-box">
                <div className="arch-box-icon">
                  <Database size={18} />
                </div>
                <h5>Pinecone Cloud Vector DB</h5>
                <p>1536-dimensional vector store with metadata filtering (file, lines, repo)</p>
                <span className="tech-tag">Pinecone Vector</span>
              </div>
            </div>
          </div>

          <div className="flow-connector-line">
            <ArrowRight size={18} className="connector-arrow" />
          </div>

          {/* Row 3: Retrieval & LLM Generation */}
          <div className="arch-flow-stage">
            <div className="stage-header">
              <span className="stage-num">03</span>
              <h4>Retrieval, Re-Ranking & Groq LLM</h4>
            </div>
            <div className="stage-boxes-grid">
              <div className="arch-box">
                <div className="arch-box-icon">
                  <Search size={18} />
                </div>
                <h5>Re-ranker & Filter</h5>
                <p>Top-20 candidate retrieval, metadata filtering, semantic keyword re-ranking</p>
                <span className="tech-tag">Top-5 Context</span>
              </div>
              <div className="arch-box arch-box-highlight">
                <div className="arch-box-icon icon-orange">
                  <Cpu size={18} />
                </div>
                <h5>Groq LLM Engine</h5>
                <p>Ultra-low latency inference with 131k context window and code citations</p>
                <span className="tech-tag">Groq 120B</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specs Table */}
        <div className="tech-specs-grid">
          <div className="spec-card">
            <span className="spec-label">Inference Engine</span>
            <span className="spec-val">Groq LPU Acceleration</span>
            <span className="spec-detail">Sub-second token streaming</span>
          </div>
          <div className="spec-card">
            <span className="spec-label">Model Context</span>
            <span className="spec-val">131,072 Tokens</span>
            <span className="spec-detail">Deep codebase repository reasoning</span>
          </div>
          <div className="spec-card">
            <span className="spec-label">Vector Store</span>
            <span className="spec-val">Pinecone Cloud</span>
            <span className="spec-detail">Cosine similarity top-k search</span>
          </div>
          <div className="spec-card">
            <span className="spec-label">Streaming Protocol</span>
            <span className="spec-val">Server-Sent Events</span>
            <span className="spec-detail">Zero-wait real-time token delivery</span>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ──────────────────────────────── */}
      <section id="how-it-works" className="info-section-card">
        <div className="section-badge-pill">
          <GitBranch size={13} className="text-orange" />
          <span>Step-by-Step</span>
        </div>
        <h2 className="section-editorial-title">
          How It <span className="title-italic-orange">Works.</span>
        </h2>
        <p className="section-editorial-sub">
          Connect any public GitHub repository and receive verified answers with file references in four intuitive steps.
        </p>

        <div className="how-steps-grid">
          {/* Step 1 */}
          <div className="how-step-card">
            <div className="step-number-badge">01</div>
            <div className="step-icon-circle">
              <GitBranch size={22} className="text-orange" />
            </div>
            <h3>Connect GitHub Repository</h3>
            <p>
              Paste any GitHub repository URL. The ingestion service fetches the file tree via Octokit, filtering out binary blobs, vendor libraries, and build artifacts.
            </p>
            <div className="step-footer-tag">githubLoader.js</div>
          </div>

          {/* Step 2 */}
          <div className="how-step-card">
            <div className="step-number-badge">02</div>
            <div className="step-icon-circle">
              <Code2 size={22} className="text-orange" />
            </div>
            <h3>AST-Aware Code Chunking</h3>
            <p>
              Rather than splitting code arbitrarily by line counts, files are parsed into logical syntactic units (functions, classes, methods) with exact line range markers.
            </p>
            <div className="step-footer-tag">chunkCode.js</div>
          </div>

          {/* Step 3 */}
          <div className="how-step-card">
            <div className="step-number-badge">03</div>
            <div className="step-icon-circle">
              <Database size={22} className="text-orange" />
            </div>
            <h3>Vectorize & Sync to Pinecone</h3>
            <p>
              Chunks are transformed into 1536-dimensional embeddings and upserted into Pinecone cloud database with rich metadata for instant semantic lookup.
            </p>
            <div className="step-footer-tag">vectorService.js</div>
          </div>

          {/* Step 4 */}
          <div className="how-step-card">
            <div className="step-number-badge">04</div>
            <div className="step-icon-circle">
              <Sparkles size={22} className="text-orange" />
            </div>
            <h3>Ask & Stream Groq Answers</h3>
            <p>
              Ask any question in plain English. The query retrieves top candidates, re-ranks them by semantic relevance, and Groq streams back the answer with file citations.
            </p>
            <div className="step-footer-tag">llmService.js</div>
          </div>
        </div>

        <div className="how-cta-banner">
          <div>
            <h4>Ready to explore your codebase?</h4>
            <p>Index your repository in seconds and ask your first question.</p>
          </div>
          <button className="btn-hero-primary" onClick={onOpenIngest}>
            <span>Index Repository Now</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── Features Section ─────────────────────────────────── */}
      <section id="features" className="info-section-card">
        <div className="section-badge-pill">
          <Zap size={13} className="text-orange" />
          <span>Capabilities</span>
        </div>
        <h2 className="section-editorial-title">
          Engineered for <span className="title-italic-orange">Developers.</span>
        </h2>
        <p className="section-editorial-sub">
          Everything you need to navigate, understand, and document complex software architectures.
        </p>

        <div className="features-grid">
          <div className="feature-item-card">
            <div className="feature-icon-wrapper">
              <Cpu size={22} className="text-orange" />
            </div>
            <h4>Groq LPU Inference</h4>
            <p>
              Powered by Groq's high-speed inference processing, delivering answers in milliseconds with real-time SSE token streaming.
            </p>
            <ul className="feature-bullet-list">
              <li><CheckCircle2 size={13} /> Sub-second initial token latency</li>
              <li><CheckCircle2 size={13} /> 131k token context buffer</li>
            </ul>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-wrapper">
              <FileCode size={22} className="text-orange" />
            </div>
            <h4>Exact Source Line Citations</h4>
            <p>
              Never guess where an answer came from. Every explanation references exact file paths and line ranges with interactive citation chips.
            </p>
            <ul className="feature-bullet-list">
              <li><CheckCircle2 size={13} /> File path & line range tags</li>
              <li><CheckCircle2 size={13} /> Verified repository grounding</li>
            </ul>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-wrapper">
              <Search size={22} className="text-orange" />
            </div>
            <h4>AST Syntactic Chunking</h4>
            <p>
              Respects function, class, and method boundaries to ensure code snippets stay contextually complete and syntactically valid.
            </p>
            <ul className="feature-bullet-list">
              <li><CheckCircle2 size={13} /> Multi-language source support</li>
              <li><CheckCircle2 size={13} /> Scope & boundary preservation</li>
            </ul>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-wrapper">
              <Database size={22} className="text-orange" />
            </div>
            <h4>Pinecone Cloud Vector Store</h4>
            <p>
              High-dimensional vector storage hosted in the cloud, guaranteeing instant vector similarity queries and reliable index persistence.
            </p>
            <ul className="feature-bullet-list">
              <li><CheckCircle2 size={13} /> Scalable multi-vector index</li>
              <li><CheckCircle2 size={13} /> Metadata-filtered lookups</li>
            </ul>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-wrapper">
              <Repeat size={22} className="text-orange" />
            </div>
            <h4>Multi-Turn Conversation Memory</h4>
            <p>
              Follow up on code questions naturally. The chat preserves conversation history and context across turns.
            </p>
            <ul className="feature-bullet-list">
              <li><CheckCircle2 size={13} /> Conversation context preservation</li>
              <li><CheckCircle2 size={13} /> Iterative code exploration</li>
            </ul>
          </div>

          <div className="feature-item-card">
            <div className="feature-icon-wrapper">
              <ShieldCheck size={22} className="text-orange" />
            </div>
            <h4>Quota-Resilient Fallback</h4>
            <p>
              Designed with graceful fallback handlers so query and vector routines remain operational even during external API downtime.
            </p>
            <ul className="feature-bullet-list">
              <li><CheckCircle2 size={13} /> Multi-provider embedding strategy</li>
              <li><CheckCircle2 size={13} /> Informative user error prompts</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
