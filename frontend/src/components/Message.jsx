import React from 'react';
import Markdown from 'react-markdown';
import CodeSnippet from './CodeSnippet';
import { Bot, User } from 'lucide-react';

/**
 * Message component - renders a single chat message (user or bot)
 */
export default function Message({ role, content, isStreaming }) {
  return (
    <div className={`message ${role}`}>
      <div className="message-avatar">
        {role === 'user' ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={`message-content ${isStreaming ? 'streaming-cursor' : ''}`}>
        {role === 'user' ? (
          <p>{content}</p>
        ) : content ? (
          <Markdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const code = String(children).replace(/\n$/, '');

                if (!inline && match) {
                  return (
                    <CodeSnippet
                      language={match[1]}
                      code={code}
                    />
                  );
                }

                return (
                  <code
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: '#a78bfa',
                    }}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </Markdown>
        ) : (
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
    </div>
  );
}
