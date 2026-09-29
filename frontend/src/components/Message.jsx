import React from 'react';
import Markdown from 'react-markdown';
import CodeSnippet from './CodeSnippet';
import { Sparkles, User } from 'lucide-react';

/**
 * Message component - renders a single chat message (user or bot)
 */
export default function Message({ role, content, isStreaming }) {
  return (
    <div className={`message-row ${role}`}>
      <div className={`message-avatar ${role}`}>
        {role === 'user' ? <User size={15} /> : <Sparkles size={15} />}
      </div>
      <div className={`message-bubble ${role} ${isStreaming ? 'streaming-cursor' : ''}`}>
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
                    className="inline-code-pill"
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
