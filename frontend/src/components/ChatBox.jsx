import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import { streamChat } from '../services/api';
import { Send, Code2, MessageSquare, FileCode, Trash2 } from 'lucide-react';

const SUGGESTIONS = [
  'Where is authentication implemented?',
  'Show me the main entry point',
  'How does the API handle errors?',
  'What database models exist?',
];

/**
 * ChatBox component - message list + input bar with multi-turn support
 */
export default function ChatBox({ isIndexed }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [references, setReferences] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, references]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
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

  const handleClear = () => {
    setMessages([]);
    setReferences([]);
  };

  const handleSend = async (question = input) => {
    if (!question.trim() || isStreaming) return;

    const userMessage = { role: 'user', content: question.trim() };
    const botMessage = { role: 'bot', content: '', isStreaming: true };

    // Get history before adding new messages
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
        setReferences(refs);
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
          updated[updated.length - 1] = {
            role: 'bot',
            content: `❌ Error: ${error}`,
            isStreaming: false,
          };
          return updated;
        });
        setIsStreaming(false);
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-area">
      {/* Header */}
      <div className="chat-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} />
          Chat
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Trash2 size={12} /> Clear
            </button>
          )}
          {isIndexed && (
            <span style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ● Ready
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="message-list">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="icon">
              <Code2 size={28} />
            </div>
            <h3>Ask anything about the codebase</h3>
            <p>
              Index a GitHub repository from the sidebar, then ask questions about its code structure, functions, and architecture.
            </p>
            {isIndexed && (
              <div className="suggestion-chips">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="suggestion-chip"
                    onClick={() => handleSend(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <Message
                key={idx}
                role={msg.role}
                content={msg.content}
                isStreaming={msg.isStreaming}
              />
            ))}

            {/* File References */}
            {references.length > 0 && !isStreaming && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                paddingLeft: '44px',
                animation: 'fadeIn 0.3s ease',
              }}>
                {references.map((ref, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      color: 'var(--accent-hover)',
                    }}
                  >
                    <FileCode size={12} />
                    {ref.file}:{ref.lines}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="input-bar">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isIndexed
                ? 'Ask about the codebase... (Shift+Enter for new line)'
                : 'Index a repository first...'
            }
            disabled={!isIndexed || isStreaming}
            rows={1}
          />
          <button
            className="btn-send"
            onClick={() => handleSend()}
            disabled={!input.trim() || !isIndexed || isStreaming}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
