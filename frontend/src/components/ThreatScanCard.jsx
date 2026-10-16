import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Shield
} from 'lucide-react';

export default function ThreatScanCard({
  threatScan,
  target,
  targetType = 'target',
  title
}) {
  const [showEngines, setShowEngines] = useState(false);
  const [engineFilter, setEngineFilter] = useState('all'); // 'all', 'flagged', 'clean'
  const [engineSearch, setEngineSearch] = useState('');

  if (!threatScan) {
    return (
      <div className="threat-scan-card">
        <div className="threat-header-row">
          <div className="threat-title-group">
            <Shield size={18} className="text-cyan" />
            <h3>{title || 'VirusTotal Threat Intelligence'}</h3>
          </div>
          <span className="page-badge text-xs">Security Telemetry</span>
        </div>
        <div className="p-3 rounded-lg bg-inner border border-subtle text-xs text-secondary flex items-center justify-between">
          <span>Threat scan telemetry is not available for this target (e.g. internal network or private IP).</span>
          <span className="font-mono text-muted text-[11px]">{target}</span>
        </div>
      </div>
    );
  }

  const {
    found = true,
    summary = {},
    reputation = 0,
    permalink,
    engines = [],
    message
  } = threatScan;

  const malicious = summary.malicious || 0;
  const suspicious = summary.suspicious || 0;
  const harmless = summary.harmless || 0;
  const undetected = summary.undetected || 0;
  const totalEngines = summary.totalEngines || (malicious + suspicious + harmless + undetected) || 0;

  const isMalicious = malicious > 0;
  const isSuspicious = suspicious > 0 && !isMalicious;
  const isClean = !isMalicious && !isSuspicious;

  const verdictClass = isMalicious
    ? 'threat-verdict-malicious'
    : isSuspicious
    ? 'threat-verdict-suspicious'
    : found
    ? 'threat-verdict-clean'
    : 'threat-verdict-neutral';

  const verdictTitle = summary.verdict || (
    isMalicious
      ? 'Malicious Threat Detected'
      : isSuspicious
      ? 'Suspicious Activity Detected'
      : found
      ? 'Clean / Harmless'
      : 'No Telemetry Recorded'
  );

  const displayTarget = target || threatScan.target || '';
  const displayType = targetType || threatScan.targetType || 'target';

  // Compute progress bar percentages
  const malPct = totalEngines > 0 ? (malicious / totalEngines) * 100 : 0;
  const suspPct = totalEngines > 0 ? (suspicious / totalEngines) * 100 : 0;
  const harmPct = totalEngines > 0 ? (harmless / totalEngines) * 100 : (found ? 100 : 0);
  const undetPct = totalEngines > 0 ? (undetected / totalEngines) * 100 : 0;

  // Filtered engines list
  const filteredEngines = useMemo(() => {
    if (!engines || engines.length === 0) return [];
    return engines.filter((e) => {
      // Category filter
      if (engineFilter === 'flagged' && e.category !== 'malicious' && e.category !== 'suspicious') {
        return false;
      }
      if (engineFilter === 'clean' && e.category !== 'harmless' && e.category !== 'undetected') {
        return false;
      }
      // Text search
      if (engineSearch.trim()) {
        const query = engineSearch.toLowerCase();
        return (
          e.engine.toLowerCase().includes(query) ||
          (e.result && e.result.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [engines, engineFilter, engineSearch]);

  const flaggedCount = malicious + suspicious;

  return (
    <div className="threat-scan-card">
      {/* Card Header */}
      <div className="threat-header-row">
        <div className="threat-title-group">
          {isMalicious ? (
            <ShieldAlert size={18} className="text-rose-600" />
          ) : isSuspicious ? (
            <AlertTriangle size={18} className="text-amber-500" />
          ) : (
            <ShieldCheck size={18} className="text-emerald" />
          )}
          <h3>{title || `VirusTotal Threat Intelligence • ${displayTarget}`}</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="threat-live-tag">
            <span className="threat-live-dot" />
            <span>VirusTotal Live</span>
          </span>
          {permalink && (
            <a
              href={permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary text-xs py-1"
              title="Open full threat analysis on VirusTotal.com"
            >
              <ExternalLink size={12} />
              <span>VirusTotal Report</span>
            </a>
          )}
        </div>
      </div>

      {/* Verdict Banner */}
      <div className={`threat-verdict-banner ${verdictClass}`}>
        <div className="threat-verdict-content">
          {isMalicious ? (
            <XCircle size={32} className="text-rose-600 flex-shrink-0" />
          ) : isSuspicious ? (
            <AlertTriangle size={32} className="text-amber-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={32} className="text-emerald flex-shrink-0" />
          )}
          <div>
            <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-secondary">
              Security Verdict
            </div>
            <div className="threat-verdict-title">{verdictTitle}</div>
            <div className="threat-verdict-desc">
              {isMalicious
                ? `${malicious} of ${totalEngines} security vendors flagged this ${displayType} as malicious.`
                : isSuspicious
                ? `${suspicious} security vendor(s) flagged this ${displayType} as suspicious.`
                : found
                ? `0 of ${totalEngines} security engines flagged threats. Validated clean.`
                : (message || 'Target not previously observed in VirusTotal threat records.')}
            </div>
          </div>
        </div>

        <div className="threat-ratio-box">
          <div className="threat-ratio-label">Detection Ratio</div>
          <div
            className={`threat-ratio-number ${
              isMalicious ? 'text-rose-600' : isSuspicious ? 'text-amber-600' : 'text-emerald'
            }`}
          >
            {malicious}/{totalEngines}
          </div>
          <div className="text-[11px] text-muted">Vendors Flagged</div>
        </div>
      </div>

      {/* Visual Multi-Segment Risk Bar */}
      {totalEngines > 0 && (
        <div className="threat-progress-bar" title={`Malicious: ${malicious}, Suspicious: ${suspicious}, Clean: ${harmless}, Undetected: ${undetected}`}>
          {malPct > 0 && <div style={{ width: `${malPct}%`, background: '#dc2626' }} />}
          {suspPct > 0 && <div style={{ width: `${suspPct}%`, background: '#d97706' }} />}
          {harmPct > 0 && <div style={{ width: `${harmPct}%`, background: '#059669' }} />}
          {undetPct > 0 && <div style={{ width: `${undetPct}%`, background: '#cbd5e1' }} />}
        </div>
      )}

      {/* Metrics Stat Chips */}
      <div className="threat-stat-chips">
        <div className="threat-stat-chip">
          <span className="chip-label">Malicious</span>
          <span className={`chip-val ${malicious > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
            {malicious}
          </span>
        </div>
        <div className="threat-stat-chip">
          <span className="chip-label">Suspicious</span>
          <span className={`chip-val ${suspicious > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
            {suspicious}
          </span>
        </div>
        <div className="threat-stat-chip">
          <span className="chip-label">Clean / Harmless</span>
          <span className="chip-val text-emerald">
            {harmless}
          </span>
        </div>
        <div className="threat-stat-chip">
          <span className="chip-label">Reputation Score</span>
          <span className={`chip-val ${reputation < 0 ? 'text-rose-600' : reputation > 0 ? 'text-emerald' : 'text-slate-700'}`}>
            {reputation >= 0 ? `+${reputation}` : reputation}
          </span>
        </div>
      </div>

      {/* Collapsible Engines Drawer */}
      {engines && engines.length > 0 && (
        <div className="threat-engines-drawer">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary text-xs py-1.5"
              onClick={() => setShowEngines(!showEngines)}
            >
              <span>{showEngines ? 'Hide' : 'Inspect'} Security Engines ({engines.length} Vendors)</span>
              {showEngines ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showEngines && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex rounded-md border border-subtle overflow-hidden text-xs">
                  <button
                    type="button"
                    className={`px-2.5 py-1 ${engineFilter === 'all' ? 'bg-sky-50 text-cyan font-bold' : 'bg-white text-secondary'}`}
                    onClick={() => setEngineFilter('all')}
                  >
                    All ({engines.length})
                  </button>
                  {flaggedCount > 0 && (
                    <button
                      type="button"
                      className={`px-2.5 py-1 ${engineFilter === 'flagged' ? 'bg-rose-50 text-rose-600 font-bold' : 'bg-white text-secondary'}`}
                      onClick={() => setEngineFilter('flagged')}
                    >
                      Flagged ({flaggedCount})
                    </button>
                  )}
                  <button
                    type="button"
                    className={`px-2.5 py-1 ${engineFilter === 'clean' ? 'bg-emerald-50 text-emerald font-bold' : 'bg-white text-secondary'}`}
                    onClick={() => setEngineFilter('clean')}
                  >
                    Clean ({harmless + undetected})
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter engine..."
                    value={engineSearch}
                    onChange={(e) => setEngineSearch(e.target.value)}
                    className="input-field text-xs py-1 px-2.5 w-36 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {showEngines && (
            <div className="threat-engines-grid">
              {filteredEngines.length > 0 ? (
                filteredEngines.map((eng, idx) => {
                  const isEngMal = eng.category === 'malicious';
                  const isEngSusp = eng.category === 'suspicious';
                  return (
                    <div key={idx} className="threat-engine-item">
                      <span className="threat-engine-name" title={eng.engine}>
                        {eng.engine}
                      </span>
                      <span
                        className={`status-pill ${
                          isEngMal
                            ? 'status-danger'
                            : isEngSusp
                            ? 'status-warning'
                            : 'status-success'
                        } text-[10px] py-0 px-1.5`}
                      >
                        {isEngMal ? 'Malicious' : isEngSusp ? 'Suspicious' : 'Clean'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-muted col-span-full py-3 text-center">
                  No security engines match the active filter.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
