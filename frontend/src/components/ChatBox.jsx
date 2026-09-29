import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import { streamChat, fetchChatHistory, clearChatHistoryApi } from '../services/api';
import { Send, Sparkles, MessageSquare, FileCode, Trash2, Zap, GitBranch, ArrowUpRight, LogIn, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SUGGESTIONS = [
  'Where is authentication implemented?',
  'Show me the main entry point and request flow',
  'How does the API handle errors and status codes?',
  'What vector database models and schemas exist?',
];

export default function ChatBox({ isIndexed, onOpenIngest, onOpenAuth }) {
  const { user, isAuthenticated, activeRepo } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [references, setReferences] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, references]);

  // Load persistent chat history whenever active repository or authentication state changes
  useEffect(() => {
    if (isAuthenticated && activeRepo?.repoUrl) {
      loadHistory(activeRepo.repoUrl);
    } else {
      setMessages([]);
      setReferences([]);
    }
  }, [isAuthenticated, activeRepo?.repoUrl]);

  const loadHistory = async (repoUrl) => {
    setIsLoadingHistory(true);
    try {
      const history = await fetchChatHistory(repoUrl);
      if (history && history.length > 0) {
        setMessages(
          history.map((m) => ({
            role: m.role,
            content: m.content,
            isStreaming: false,
          }))
        );
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Build conversation history from messages for multi-turn
  const getHistory = () => {
    return messages
      .filter((m) => m.content && !m.isStreaming)
      .map((m) => ({ role: m.role, content: m.content }));
  };

  const handleClear = async () => {
    setMessages([]);
    setReferences([]);
    if (activeRepo?.repoUrl) {
      try {
        await clearChatHistoryApi(activeRepo.repoUrl);
      } catch (err) {
        console.error('Failed to clear remote chat history:', err);
      }
    }
  };

  const handleSend = async (question = input) => {
    // Check compulsory Google authentication first
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    // Check if repository is indexed
    if (!isIndexed || !activeRepo?.repoUrl) {
      if (onOpenIngest) onOpenIngest();
      return;
    }

    if (!question.trim() || isStreaming) return;

    const userMessage = { role: 'user', content: question.trim() };
    const botMessage = { role: 'bot', content: '', isStreaming: true };

    const history = getHistory();

    setMessages((prev) => [...prev, userMessage, botMessage]);
    setInput('');
    setIsStreaming(true);
    setReferences([]);

    await streamChat(
      question.trim(),
      history,
      // onToken
      (token) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = {
            ...last,
            content: last.content + token,
          };
          return updated;
        });
      },
      // onRefs
      (refs) => {
        setReferences(refs || []);
      },
      // onDone
      () => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            isStreaming: false,
          };
          return updated;
        });
        setIsStreaming(false);
      },
      // onError
      (error) => {
        setMessages((prev) => {
          const updated = [...prev];
          const isNotIndexed = error.includes('No indexed') || error.includes('not found');
          updated[updated.length - 1] = {
            role: 'bot',
            content: isNotIndexed
              ? `💡 **No repository has been indexed yet.**\n\nClick the **"Index Repo"** button in the navbar above to index any public GitHub repository first!`
              : `⚠️ **Query Failed:** ${error}\n\n*Please ensure your GROQ_API_KEY is configured in backend/.env.*`,
            isStreaming: false,
          };
          return updated;
        });
        setIsStreaming(false);
      },
      activeRepo?.repoUrl
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const repoDisplayName = activeRepo?.repoUrl
    ? activeRepo.repoUrl.replace('https://github.com/', '')
    : null;

  return (
    <div className="chat-card-container">
      {/* Chat Card Header */}
      <div className="chat-card-header">
        <div className="header-left">
          <div className="chat-header-badge">
            <MessageSquare size={16} className="text-orange" />
          </div>
          <div>
            <h2 className="chat-header-title">Codebase Q&A Console</h2>
            <p className="chat-header-sub">
              {isAuthenticated && repoDisplayName
                ? `Active Repository: ${repoDisplayName} (${activeRepo?.totalChunks || 0} chunks)`
                : isIndexed
                ? 'Connected to vector store'
                : 'Awaiting repository indexing'}
            </p>
          </div>
        </div>

        <div className="header-right">
          {isAuthenticated && messages.length > 0 && (
            <div className="history-pill-badge" title="Persistent conversation saved to your account">
              <History size={12} className="text-orange" />
              <span>Persistent Chat</span>
            </div>
          )}

          <div className="engine-pill">
            <Zap size={13} className="text-orange" />
            <span>Groq LPU Engine</span>
          </div>

          {messages.length > 0 && (
            <button onClick={handleClear} className="btn-clear-chat" title="Clear conversation for this repository">
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Viewport */}
      <div className="chat-viewport">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-sparkle-circle">
              <Sparkles size={32} className="text-orange" />
            </div>
            <h3 className="empty-title">
              {!isAuthenticated
                ? 'Sign in to explore any codebase'
                : isIndexed
                ? `Ask anything about ${repoDisplayName || 'your codebase'}`
                : 'Index a repository to get started'}
            </h3>
            <p className="empty-description">
              {!isAuthenticated
                ? 'Sign in or create an account to index repositories into your private Pinecone namespace. Your code chunks and chat history persist permanently across visits.'
                : 'Query functions, architecture decisions, data models, or error flows. Groq will stream back answers with verified file and line citations.'}
            </p>

            {!isAuthenticated ? (
              <button className="btn-empty-index" onClick={onOpenAuth}>
                <LogIn size={15} />
                <span>Sign In or Sign Up to Begin</span>
              </button>
            ) : !isIndexed ? (
              <button className="btn-empty-index" onClick={onOpenIngest}>
                <GitBranch size={15} />
                <span>Index a GitHub Repository</span>
              </button>
            ) : null}

            <div className="suggestions-container">
              <span className="suggestions-label">
                {isIndexed && isAuthenticated
                  ? 'Try asking:'
                  : 'Sample queries (available after indexing):'}
              </span>
              <div className="suggestion-chips-grid">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    className={`suggestion-chip-pill ${!isIndexed || !isAuthenticated ? 'chip-locked' : ''}`}
                    onClick={() => {
                      if (!isAuthenticated) {
                        if (onOpenAuth) onOpenAuth();
                      } else if (!isIndexed) {
                        if (onOpenIngest) onOpenIngest();
                      } else {
                        handleSend(s);
                      }
                    }}
                    title={
                      !isAuthenticated
                        ? 'Sign in with Google to ask this'
                        : !isIndexed
                        ? 'Index a repository first to ask this'
                        : s
                    }
                  >
                    <span>{s}</span>
                    <ArrowUpRight size={13} className="chip-arrow" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="messages-stream">
            {messages.map((msg, idx) => (
              <Message
                key={idx}
                role={msg.role}
                content={msg.content}
                isStreaming={msg.isStreaming}
              />
            ))}

            {/* Source Citations */}
            {references.length > 0 && !isStreaming && (
              <div className="references-shelf">
                <span className="references-heading">
                  <FileCode size={13} /> Cited Files & Lines:
                </span>
                <div className="references-chips-list">
                  {references.map((ref, i) => (
                    <div key={i} className="ref-chip">
                      <span className="ref-chip-file">{ref.file}</span>
                      <span className="ref-chip-lines">L{ref.lines}</span>
                      {ref.language && <span className="ref-chip-lang">{ref.language}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      <div className="chat-input-bar">
        <div
          className={`input-pill-wrapper ${
            !isAuthenticated || !isIndexed ? 'input-wrapper-disabled' : ''
          }`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !isAuthenticated
                ? '🔒 Please sign in or create an account to enable questioning...'
                : isIndexed
                ? `Ask a question about ${repoDisplayName || 'the repository'}... (Press Enter to send)`
                : '🔒 Index a repository first to enable asking questions...'
            }
            disabled={!isAuthenticated || !isIndexed || isStreaming}
            rows={1}
          />
          <button
            className="btn-send-pill"
            onClick={() => handleSend()}
            disabled={!isAuthenticated || !isIndexed || !input.trim() || isStreaming}
            aria-label="Send query"
            title={
              !isAuthenticated
                ? 'Please sign in or create an account'
                : !isIndexed
                ? 'Please index a repository first'
                : 'Send question'
            }
          >
            <Send size={16} />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="input-locked-banner" onClick={onOpenAuth} role="button" tabIndex={0}>
            <span>🔒 Authentication required: <strong>Sign In or Sign Up</strong> to index repositories and access persistent chats.</span>
          </div>
        ) : !isIndexed ? (
          <div className="input-locked-banner" onClick={onOpenIngest} role="button" tabIndex={0}>
            <span>⚠️ Questions are locked. <strong>Click here to index a repository first</strong> to start querying.</span>
          </div>
        ) : (
          <div className="input-footer-hint">
            <span>Groq LPU Engine · Persistent Chat History · Line-by-line Source References</span>
          </div>
        )}
      </div>
    </div>
  );
}
