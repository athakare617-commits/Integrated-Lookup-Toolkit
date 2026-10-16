import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ErrorAlert({ title = 'Notice', message, onClose }) {
  if (!message) return null;

  return (
    <div className="cyber-error-alert" role="alert">
      <div className="error-icon-box">
        <AlertTriangle size={18} />
      </div>
      <div className="error-content">
        <div className="error-title">{title}</div>
        <div className="error-message">{message}</div>
      </div>
      {onClose && (
        <button className="error-close-btn" onClick={onClose} aria-label="Dismiss alert">
          <X size={16} />
        </button>
      )}

      <style>{`
        .cyber-error-alert {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-left: 4px solid #dc2626;
          border-radius: 8px;
          padding: 0.85rem 1.15rem;
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          margin-top: 1rem;
          margin-bottom: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          animation: slide-in 0.2s ease-out;
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .error-icon-box {
          color: #dc2626;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .error-content {
          flex: 1;
        }
        .error-title {
          font-size: 0.775rem;
          font-weight: 700;
          color: #991b1b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .error-message {
          font-size: 0.875rem;
          color: #7f1d1d;
          font-weight: 500;
          margin-top: 0.2rem;
          line-height: 1.45;
        }
        .error-close-btn {
          background: transparent;
          border: none;
          color: #991b1b;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          opacity: 0.75;
        }
        .error-close-btn:hover {
          background: #fee2e2;
          color: #7f1d1d;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

