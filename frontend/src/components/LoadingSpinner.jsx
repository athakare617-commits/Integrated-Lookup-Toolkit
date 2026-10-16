import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Running lookup...' }) {
  return (
    <div className="loading-container">
      <div className="spinner-wrapper">
        <Loader2 className="animate-spin text-cyan" size={36} />
        <div className="spinner-ring" />
      </div>
      <p className="loading-text">{text}</p>
      <span className="loading-subtext">Querying network resolvers & services...</span>

      <style>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          background: var(--card-bg);
          border: 1px dashed var(--border-subtle);
          border-radius: 12px;
          margin-top: 1.5rem;
        }
        .spinner-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        .text-cyan {
          color: var(--accent-cyan);
        }
        .loading-text {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }
        .loading-subtext {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
}
