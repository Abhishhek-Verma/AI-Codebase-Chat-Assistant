import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileCode, Copy, Check } from 'lucide-react';

/**
 * CodeSnippet component - syntax-highlighted code block with copy button
 */
export default function CodeSnippet({ language, code, fileName, lines }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-snippet">
      <div className="code-header">
        <span className="file-ref">
          <FileCode size={14} />
          {fileName || language}
          {lines && <span style={{ opacity: 0.6 }}> · Lines {lines}</span>}
        </span>
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? (
            <>
              <Check size={12} /> Copied
            </>
          ) : (
            <>
              <Copy size={12} /> Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          background: '#0d1117',
          fontSize: '13px',
          lineHeight: '1.5',
        }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
