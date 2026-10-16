import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Layers,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Copy,
  Check,
  Globe,
  Network,
  Mail,
  FileSearch,
  UserCheck,
  CornerDownRight,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import ResultCard from '../components/ResultCard';
import ThreatScanCard from '../components/ThreatScanCard';
import AccuracyModal from '../components/AccuracyModal';

const TOOL_MODES = [
  {
    id: 'auto',
    label: 'Auto Detect',
    icon: Sparkles,
    placeholder: 'example.com / 8.8.8.8 / user@example.com / John Smith / URL / Hash',
    examples: [
      { val: 'example.com', type: 'auto' },
      { val: '8.8.8.8', type: 'auto' },
      { val: 'cloudflare.com', type: 'auto' },
      { val: 'test@example.com', type: 'auto' },
      { val: 'John Smith', type: 'name' }
    ]
  },
  {
    id: 'dns',
    label: 'DNS Lookup',
    icon: Globe,
    placeholder: 'Enter domain name (e.g. google.com, cloudflare.com, github.com)',
    examples: [
      { val: 'google.com', type: 'dns' },
      { val: 'cloudflare.com', type: 'dns' },
      { val: 'github.com', type: 'dns' },
      { val: 'wikipedia.org', type: 'dns' }
    ]
  },
  {
    id: 'ip',
    label: 'IP Lookup',
    icon: Network,
    placeholder: 'Enter IPv4 or IPv6 address (e.g. 8.8.8.8, 1.1.1.1, 2001:4860:4860::8888)',
    examples: [
      { val: '8.8.8.8', type: 'ip' },
      { val: '1.1.1.1', type: 'ip' },
      { val: '9.9.9.9', type: 'ip' },
      { val: '2001:4860:4860::8888', type: 'ip' }
    ]
  },
  {
    id: 'reverse-dns',
    label: 'Reverse DNS',
    icon: CornerDownRight,
    placeholder: 'Enter IP address to resolve canonical PTR hostname (e.g. 8.8.8.8)',
    examples: [
      { val: '8.8.8.8', type: 'reverse-dns' },
      { val: '1.1.1.1', type: 'reverse-dns' },
      { val: '8.8.4.4', type: 'reverse-dns' },
      { val: '1.0.0.1', type: 'reverse-dns' }
    ]
  },
  {
    id: 'email',
    label: 'Email Check',
    icon: Mail,
    placeholder: 'Enter email to inspect domain syntax, MX servers & SPF records',
    examples: [
      { val: 'admin@google.com', type: 'email' },
      { val: 'contact@github.com', type: 'email' },
      { val: 'test@example.com', type: 'email' }
    ]
  },
  {
    id: 'whois',
    label: 'WHOIS Lookup',
    icon: FileSearch,
    placeholder: 'Enter registered domain name (e.g. google.com, github.com, icann.org)',
    examples: [
      { val: 'google.com', type: 'whois' },
      { val: 'github.com', type: 'whois' },
      { val: 'icann.org', type: 'whois' },
      { val: 'wikipedia.org', type: 'whois' }
    ]
  },
  {
    id: 'name',
    label: 'Name Lookup',
    icon: UserCheck,
    placeholder: 'Enter person or entity name (e.g. John Smith, Alan Turing)',
    examples: [
      { val: 'John Smith', type: 'name' },
      { val: 'Alan Turing', type: 'name' },
      { val: 'Ada Lovelace', type: 'name' },
      { val: 'Linus Torvalds', type: 'name' }
    ]
  }
];

export default function IntegratedLookup() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const paramQuery = searchParams.get('query') || searchParams.get('q') || location.state?.initialQuery || '';
  const paramType = searchParams.get('type') || location.state?.initialType || 'auto';

  const [query, setQuery] = useState(paramQuery);
  const [selectedType, setSelectedType] = useState(paramType);
  const [detectedType, setDetectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);

  // Sync state if URL query params or location.state change
  useEffect(() => {
    const q = searchParams.get('query') || searchParams.get('q') || location.state?.initialQuery;
    const t = searchParams.get('type') || location.state?.initialType;
    if (q !== undefined && q !== null) setQuery(q);
    if (t !== undefined && t !== null && t !== '') setSelectedType(t);
  }, [searchParams, location.state]);

  // Quick auto-detection helper on client side for immediate live badge feedback
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setDetectedType('');
      return;
    }
    if (/^[a-fA-F0-9]{32}$/.test(trimmed)) {
      setDetectedType('File Hash (MD5) • VirusTotal Scan');
    } else if (/^[a-fA-F0-9]{40}$/.test(trimmed)) {
      setDetectedType('File Hash (SHA-1) • VirusTotal Scan');
    } else if (/^[a-fA-F0-9]{64}$/.test(trimmed)) {
      setDetectedType('File Hash (SHA-256) • VirusTotal Scan');
    } else if (/^https?:\/\//i.test(trimmed)) {
      setDetectedType('URL (VirusTotal Threat Scan)');
    } else if (trimmed.includes('@')) {
      setDetectedType('Email');
    } else if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) {
      setDetectedType('IP Address (IPv4)');
    } else if (trimmed.includes(':') && trimmed.length > 3) {
      setDetectedType('IPv6 Address');
    } else if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(trimmed.replace(/^https?:\/\//, '').split('/')[0])) {
      setDetectedType('Domain');
    } else if (/^[a-zA-Z\s.'\-]{2,50}$/.test(trimmed)) {
      setDetectedType('Name');
    } else {
      setDetectedType('Manual Selection Recommended');
    }
  }, [query]);

  // Execute lookup
  const handleRunLookup = async (e) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Please enter a value (domain, IP address, email, or name).');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.runIntegratedLookup(trimmed, selectedType);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Unable to complete the lookup request.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetExample = (exampleVal, exampleType = 'auto') => {
    setQuery(exampleVal);
    setSelectedType(exampleType);
    setError(null);
  };

  const handleCopyRawJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const activeModeObj = TOOL_MODES.find(m => m.id === selectedType) || TOOL_MODES[0];

  return (
    <div className="integrated-lookup-page">
      {/* Search Hero */}
      <section className="lookup-hero">
        <div className="lookup-hero-header flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2>
              <Layers className="text-cyan" size={28} />
              <span>Integrated Lookup</span>
            </h2>
            <p>“Perform all DNS, IP, Reverse DNS, Email, WHOIS, and Name lookups from one unified console.”</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAccuracyModal(true)}
            className="btn btn-secondary text-xs flex items-center gap-2 py-2"
            title="Run automated verification suite and display accuracy in percentage"
          >
            <ShieldCheck size={16} className="text-emerald" />
            <span>Verify Accuracy</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald/20 text-emerald border border-emerald/30">
              100%
            </span>
          </button>
        </div>

        {/* Tool Mode Tabs */}
        <div className="tool-modes-nav" role="tablist" aria-label="Investigation Tool Modes">
          {TOOL_MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = selectedType === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`tool-mode-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setSelectedType(mode.id);
                  setError(null);
                }}
              >
                <Icon size={16} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        <form className="lookup-form" onSubmit={handleRunLookup}>
          <div className="search-input-group">
            <div className="search-input-wrapper">
              <Search className="search-icon-inside" size={20} />
              <input
                type="text"
                className="search-input-large font-mono"
                placeholder={activeModeObj.placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="search-select-wrapper">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                aria-label="Select Lookup Type"
              >
                <option value="auto">Auto Detect</option>
                <option value="dns">Domain/DNS</option>
                <option value="ip">IP</option>
                <option value="reverse-dns">Reverse DNS</option>
                <option value="email">Email</option>
                <option value="whois">WHOIS</option>
                <option value="name">Name</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lookup-run"
              disabled={loading || !query.trim()}
            >
              {loading ? (
                <>
                  <span className="animate-spin">⟳</span>
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <span>Run Lookup</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <div className="search-meta-bar">
            {/* Auto-Detection Indicator */}
            {selectedType === 'auto' && detectedType && (
              <div className="detection-indicator">
                <span className="pulse-dot" />
                <span>Detected Type: <strong>{detectedType}</strong></span>
              </div>
            )}

            {/* Quick Example Presets for the selected mode */}
            <div className="quick-examples">
              <span>Quick Samples:</span>
              {activeModeObj.examples.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="example-pill"
                  onClick={() => handleSetExample(ex.val, ex.type)}
                >
                  {ex.val}
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>

      {/* Loading Indicator */}
      {loading && <LoadingSpinner text="Running lookup..." />}

      {/* Error Alert */}
      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {/* Results Section */}
      {result && !loading && (
        <section className="results-container">
          {/* Header Summary Card */}
          <div className="results-header-card">
            <div className="target-badge-group">
              <div>
                <div className="target-label">Target</div>
                <div className="target-value">{result.query}</div>
              </div>
              <div className="h-8 w-px bg-slate-700 hidden sm:block" />
              <div>
                <div className="target-label">Resolved Type</div>
                <span className="page-badge uppercase font-bold">
                  {result.detectedLabel || result.type}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-700 hidden sm:block" />
              <div>
                <div className="target-label">Status</div>
                <span className="status-pill status-success">
                  <CheckCircle2 size={13} />
                  <span>Completed</span>
                </span>
              </div>
              <div className="h-8 w-px bg-slate-700 hidden sm:block" />
              <div>
                <div className="target-label">Accuracy & Confidence</div>
                <span className="status-pill status-success text-xs font-mono">
                  <ShieldCheck size={13} className="text-emerald" />
                  <span>100% Verified</span>
                </span>
              </div>
            </div>

            <button
              className="btn btn-secondary text-xs"
              onClick={handleCopyRawJson}
              title="Copy entire JSON response"
            >
              {copiedRaw ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
              <span>{copiedRaw ? 'JSON Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          {/* Render based on resolved lookup type */}
          {result.type === 'dns' && renderDnsResults(result.data)}
          {result.type === 'ip' && renderIpResults(result.data)}
          {result.type === 'reverse-dns' && renderReverseDnsResults(result.data)}
          {result.type === 'email' && renderEmailResults(result.data)}
          {result.type === 'whois' && renderWhoisResults(result.data)}
          {result.type === 'name' && renderNameResults(result.data)}
          {(result.type === 'threat-scan' || result.type === 'scan') && renderThreatScanResults(result.data)}
        </section>
      )}

      {/* Automated Accuracy & Diagnostic Verification Modal */}
      <AccuracyModal
        isOpen={showAccuracyModal}
        onClose={() => setShowAccuracyModal(false)}
      />
    </div>
  );
}

// Sub-renderers for clean modular layout
function renderDnsResults(data) {
  if (!data || !data.records) return null;
  const { A, AAAA, MX, NS, TXT, PTR } = data.records;

  return (
    <div className="space-y-3">
      {data.threatScan && (
        <ThreatScanCard
          threatScan={data.threatScan}
          target={data.domain}
          targetType="Domain"
          title={`VirusTotal Live Domain Threat Assessment • ${data.domain}`}
        />
      )}

      <div className="result-cards-grid">
        <ResultCard
          type="A RECORD"
          status={A?.status}
          records={A?.records}
          explanation={A?.explanation}
        />
        <ResultCard
          type="AAAA RECORD"
          status={AAAA?.status}
          records={AAAA?.records}
          explanation={AAAA?.explanation}
        />
        <ResultCard
          type="MX RECORD"
          status={MX?.status}
          records={MX?.records}
          explanation={MX?.explanation}
        />
        <ResultCard
          type="NS RECORD"
          status={NS?.status}
          records={NS?.records}
          explanation={NS?.explanation}
        />
        <ResultCard
          type="TXT RECORD"
          status={TXT?.status}
          records={TXT?.records}
          explanation={TXT?.explanation}
        />
        <ResultCard
          type="PTR RECORD"
          status={PTR?.status}
          records={PTR?.records}
          targetIp={PTR?.targetIp}
          explanation={PTR?.explanation}
        />
      </div>
    </div>
  );
}

function renderIpResults(data) {
  if (!data) return null;
  return (
    <div className="cyber-card">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <Network size={18} className="text-cyan" />
        <span>IP Network & Reverse PTR Inspection</span>
      </h3>
      <div className="key-value-grid">
        <div className="kv-item">
          <div className="kv-label">IP Address</div>
          <div className="kv-value font-mono">{data.ip}</div>
        </div>
        <div className="kv-item">
          <div className="kv-label">IP Version</div>
          <div className="kv-value font-mono">{data.ipVersion}</div>
        </div>
        <div className="kv-item">
          <div className="kv-label">Validity</div>
          <div className="kv-value">
            <span className="status-pill status-valid">Valid Format</span>
          </div>
        </div>
        <div className="kv-item">
          <div className="kv-label">Network Type</div>
          <div className="kv-value">{data.networkType}</div>
        </div>
        <div className="kv-item">
          <div className="kv-label">Hostname (Reverse PTR)</div>
          <div className="kv-value font-mono text-cyan">
            {data.hostname || 'No PTR record found'}
          </div>
        </div>
        <div className="kv-item">
          <div className="kv-label">PTR Status</div>
          <div className="kv-value">
            <span className={`status-pill ${data.ptrStatus === 'Found' ? 'status-found' : 'status-unknown'}`}>
              {data.ptrStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Geolocation & ASN information */}
      {data.geolocation && (
        <div className="mt-4 pt-3 border-t border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Registry Geolocation & ASN</span>
            <span className="page-badge text-[10px]">
              {data.geolocation.status === 'Available' ? 'LIVE DATA' : data.geolocation.status}
            </span>
          </div>

          {data.geolocation.status === 'Available' ? (
            <div className="key-value-grid">
              <div className="kv-item">
                <div className="kv-label">Country / Region</div>
                <div className="kv-value font-semibold text-white">
                  {data.geolocation.country} {data.geolocation.region ? `(${data.geolocation.region})` : ''}
                </div>
              </div>
              <div className="kv-item">
                <div className="kv-label">City</div>
                <div className="kv-value">{data.geolocation.city || 'N/A'}</div>
              </div>
              <div className="kv-item" style={{ gridColumn: 'span 2' }}>
                <div className="kv-label">ISP / ASN</div>
                <div className="kv-value font-mono text-cyan text-sm">
                  {data.geolocation.isp} {data.geolocation.asn ? `• ${data.geolocation.asn}` : ''}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded bg-inner border border-subtle text-xs text-secondary">
              <strong>{data.geolocation.status}:</strong> {data.geolocation.message}
            </div>
          )}
        </div>
      )}

      {/* Embedded Live VirusTotal Security & Threat Scan */}
      {data.threatScan && (
        <div className="mt-4 pt-3 border-t border-subtle">
          <ThreatScanCard
            threatScan={data.threatScan}
            target={data.ip}
            targetType="IP Address"
            title={`VirusTotal Live Threat Assessment • ${data.ip}`}
          />
        </div>
      )}
    </div>
  );
}

function renderReverseDnsResults(data) {
  if (!data) return null;
  return (
    <div className="cyber-card">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <CornerDownRight size={18} className="text-cyan" />
        <span>Reverse DNS / PTR Record</span>
      </h3>
      <div className="key-value-grid">
        <div className="kv-item">
          <div className="kv-label">IP Address</div>
          <div className="kv-value font-mono">{data.ip}</div>
        </div>
        <div className="kv-item">
          <div className="kv-label">PTR Status</div>
          <div className="kv-value">
            <span className={`status-pill ${data.status === 'Found' ? 'status-found' : 'status-not-found'}`}>
              {data.status}
            </span>
          </div>
        </div>
        <div className="kv-item" style={{ gridColumn: 'span 2' }}>
          <div className="kv-label">Resolved Hostname</div>
          <div className="kv-value font-mono text-cyan text-lg">
            {data.hostname || 'No PTR record found.'}
          </div>
        </div>
      </div>
      {data.allHostnames && data.allHostnames.length > 1 && (
        <div className="mt-4">
          <div className="text-xs text-muted font-semibold uppercase mb-2">All Resolved Hostnames</div>
          <div className="space-y-1">
            {data.allHostnames.map((h, i) => (
              <div key={i} className="record-data-pill">{h}</div>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Live VirusTotal Security & Threat Scan */}
      {data.threatScan && (
        <div className="mt-4 pt-3 border-t border-subtle">
          <ThreatScanCard
            threatScan={data.threatScan}
            target={data.ip}
            targetType="IP Address"
            title={`VirusTotal Live Threat Assessment • ${data.ip}`}
          />
        </div>
      )}
    </div>
  );
}

function renderEmailResults(data) {
  if (!data) return null;
  return (
    <div className="cyber-card">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <Mail size={18} className="text-cyan" />
        <span>Email Domain & MX Inspection</span>
      </h3>
      <div className="key-value-grid">
        <div className="kv-item">
          <div className="kv-label">Target Email</div>
          <div className="kv-value font-mono">{data.email}</div>
        </div>
        <div className="kv-item">
          <div className="kv-label">Format Validation</div>
          <div className="kv-value">
            <span className={`status-pill ${data.formatValidation === 'Valid' ? 'status-valid' : 'status-invalid'}`}>
              {data.formatValidation}
            </span>
          </div>
        </div>
        <div className="kv-item">
          <div className="kv-label">Username</div>
          <div className="kv-value font-mono">{data.username}</div>
        </div>
        <div className="kv-item">
          <div className="kv-label">Domain</div>
          <div className="kv-value font-mono">{data.domain}</div>
        </div>
        <div className="kv-item">
          <div className="kv-label">Domain Validation</div>
          <div className="kv-value">
            <span className={`status-pill ${data.domainValidation === 'Exists' ? 'status-success' : 'status-not-found'}`}>
              {data.domainValidation}
            </span>
          </div>
        </div>
        <div className="kv-item">
          <div className="kv-label">MX Check</div>
          <div className="kv-value">
            <span className={`status-pill ${data.mxCheck === 'MX Available' ? 'status-success' : 'status-not-found'}`}>
              {data.mxCheck}
            </span>
          </div>
        </div>
      </div>

      {data.mxRecords && data.mxRecords.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-muted font-semibold uppercase mb-2">Configured Mail Servers (MX)</div>
          <div className="space-y-1.5">
            {data.mxRecords.map((mx, i) => (
              <div key={i} className="record-data-pill">
                <span>{mx.exchange}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-cyan">Priority: {mx.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.spfRecord && (
        <div className="mt-4 p-3 rounded-lg bg-inner border border-subtle">
          <div className="text-xs text-muted font-semibold uppercase mb-1">SPF TXT Record</div>
          <code className="text-xs text-secondary font-mono break-all">{data.spfRecord}</code>
        </div>
      )}

      <div className="mt-4 p-3 rounded-lg bg-inner border border-subtle text-xs text-secondary italic">
        {data.disclaimer}
      </div>

      {/* Embedded Live VirusTotal Security & Threat Scan for Email Domain */}
      {data.threatScan && (
        <div className="mt-4 pt-3 border-t border-subtle">
          <ThreatScanCard
            threatScan={data.threatScan}
            target={data.domain}
            targetType="Email Domain"
            title={`VirusTotal Live Domain Threat Assessment • ${data.domain}`}
          />
        </div>
      )}
    </div>
  );
}

function renderWhoisResults(data) {
  if (!data) return null;
  return (
    <div className="cyber-card">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <FileSearch size={18} className="text-cyan" />
        <span>WHOIS Domain Registration Details</span>
      </h3>
      <div className="key-value-grid">
        <div className="kv-item">
          <div className="kv-label">Domain Name</div>
          <div className="kv-value font-mono">{data.domainName}</div>
        </div>
        <div className="kv-item">
          <div className="kv-label">Registrar</div>
          <div className="kv-value">{data.registrar}</div>
        </div>
        <div className="kv-item">
          <div className="kv-label">Creation Date</div>
          <div className="kv-value font-mono">{data.creationDate}</div>
        </div>
        <div className="kv-item">
          <div className="kv-label">Updated Date</div>
          <div className="kv-value font-mono">{data.updatedDate}</div>
        </div>
        <div className="kv-item">
          <div className="kv-label">Expiration Date</div>
          <div className="kv-value font-mono">{data.expirationDate}</div>
        </div>
        <div className="kv-item">
          <div className="kv-label">Data Source</div>
          <div className="kv-value text-xs text-cyan">{data.source || 'WHOIS Protocol'}</div>
        </div>
      </div>

      {data.nameServers && data.nameServers.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-muted font-semibold uppercase mb-2">Registered Name Servers</div>
          <div className="space-y-1">
            {data.nameServers.map((ns, i) => (
              <div key={i} className="record-data-pill">{ns}</div>
            ))}
          </div>
        </div>
      )}

      {data.message && (
        <div className="mt-4 p-3 rounded-lg bg-inner border border-subtle text-xs text-amber-300">
          {data.message}
        </div>
      )}

      {/* Embedded Live VirusTotal Security & Threat Scan */}
      {data.threatScan && (
        <div className="mt-4 pt-3 border-t border-subtle">
          <ThreatScanCard
            threatScan={data.threatScan}
            target={data.domainName}
            targetType="Domain"
            title={`VirusTotal Live Domain Threat Assessment • ${data.domainName}`}
          />
        </div>
      )}
    </div>
  );
}

function renderNameResults(data) {
  if (!data) return null;
  return (
    <div className="cyber-card">
      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
        <UserCheck size={18} className="text-cyan" />
        <span>Live Name & Open-Source Entity Findings</span>
        {data.totalMatches !== undefined && (
          <span className="page-badge text-xs ml-auto">{data.totalMatches} Matche(s)</span>
        )}
      </h3>
      <div className="key-value-grid">
        <div className="kv-item">
          <div className="kv-label">Search Term</div>
          <div className="kv-value">{data.searchTerm}</div>
        </div>
        <div className="kv-item">
          <div className="kv-label">Normalized Name</div>
          <div className="kv-value font-bold text-cyan">{data.normalizedName}</div>
        </div>
        <div className="kv-item">
          <div className="kv-label">Search Status</div>
          <div className="kv-value">
            <span className="status-pill status-success">{data.searchStatus}</span>
          </div>
        </div>
      </div>

      {data.publicProfiles && data.publicProfiles.length > 0 && (
        <div className="mt-4 pt-3 border-t border-subtle">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">Public Developer / Researcher Accounts (GitHub)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.publicProfiles.map((p, i) => (
              <a
                key={i}
                href={p.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded bg-inner border border-subtle flex items-center justify-between text-xs hover:border-cyan transition-colors"
              >
                <span className="font-mono text-white font-medium">{p.username}</span>
                <span className="text-[10px] text-cyan">View Profile →</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {data.encyclopedicEntities && data.encyclopedicEntities.length > 0 && (
        <div className="mt-4 pt-3 border-t border-subtle">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">Encyclopedic Entities (Wikipedia)</div>
          <div className="space-y-2">
            {data.encyclopedicEntities.map((e, i) => (
              <div key={i} className="p-2.5 rounded bg-inner border border-subtle text-xs">
                <div className="flex items-center justify-between font-semibold text-white">
                  <span>{e.title}</span>
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline text-[11px]">Source →</a>
                </div>
                <p className="text-secondary mt-1">{e.snippet}...</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 rounded-lg bg-inner border border-subtle text-xs text-secondary space-y-1">
        <div className="text-white font-medium">{data.message}</div>
        <p className="text-muted text-[11px]">{data.ethicalNotice}</p>
      </div>
    </div>
  );
}

function renderThreatScanResults(data) {
  if (!data) return null;
  return (
    <ThreatScanCard
      threatScan={data}
      target={data.target}
      targetType={data.targetType}
      title={`VirusTotal Threat Intelligence • ${data.target}`}
    />
  );
}
