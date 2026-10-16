import React, { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';

export default function ResultCard({
  type,
  status = 'Found',
  result,
  records = [],
  explanation,
  targetIp
}) {
  const [copied, setCopied] = useState(false);

  // Normalize display records
  let displayList = [];
  if (Array.isArray(records) && records.length > 0) {
    displayList = records;
  } else if (result) {
    displayList = Array.isArray(result) ? result : [result];
  }

  const isFound = status?.toLowerCase() === 'found' || status?.toLowerCase() === 'success' || status?.toLowerCase() === 'valid';

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="result-card-item">
      <div className="result-card-header">
        <div className="record-badge">
          <span>{type}</span>
          {targetIp && <span className="text-xs text-secondary font-normal font-mono">({targetIp})</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-pill ${isFound ? 'status-found' : 'status-not-found'}`}>
            {status}
          </span>
          {displayList.length > 0 && (
            <button
              className="btn-copy"
              title="Copy result"
              onClick={() => handleCopy(displayList.map(item => (typeof item === 'object' ? `${item.exchange || item.address || ''} ${item.priority !== undefined ? `(Priority: ${item.priority})` : ''}` : item)).join('\n'))}
            >
              {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
            </button>
          )}
        </div>
      </div>

      <div className="result-card-body">
        {displayList.length > 0 ? (
          <div className="record-data-list">
            {displayList.map((item, idx) => {
              if (typeof item === 'object' && item !== null) {
                // MX or complex record
                const mailHost = item.exchange || item.address || JSON.stringify(item);
                const priority = item.priority;
                return (
                  <div key={idx} className="record-data-pill">
                    <span>{mailHost}</span>
                    {priority !== undefined && (
                      <span className="text-xs px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                        Priority: {priority}
                      </span>
                    )}
                  </div>
                );
              }
              return (
                <div key={idx} className="record-data-pill">
                  <span>{String(item)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="record-not-found">
            No {type} records found.
          </div>
        )}
      </div>

      {explanation && (
        <div className="result-card-footer">
          <Info size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
          <span>{explanation}</span>
        </div>
      )}
    </div>
  );
}
