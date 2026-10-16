import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Play,
  Copy,
  Check,
  Globe,
  Layers,
  Network,
  Mail,
  FileSearch,
  Activity,
  Server,
  Database,
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ENDPOINTS = [
  {
    id: 'integrated',
    method: 'POST',
    path: '/api/integrated-lookup',
    title: 'Integrated Multi-Target Lookup',
    description: 'Universal search endpoint that automatically classifies the input target (IP, Domain, Email, or Name) and returns comprehensive diagnostic data.',
    defaultBody: JSON.stringify({ query: '8.8.8.8', type: 'auto' }, null, 2),
    sampleParam: ''
  },
  {
    id: 'threat-scan',
    method: 'POST',
    path: '/api/scan',
    title: 'Universal Threat & Malware Scan (VirusTotal)',
    description: 'Scans domains, IPs, URLs, or file hashes (MD5, SHA-1, SHA-256) across 70+ security vendors using live VirusTotal API v3 threat intelligence.',
    defaultBody: JSON.stringify({ query: '8.8.8.8', type: 'auto' }, null, 2),
    sampleParam: ''
  },
  {
    id: 'scan-hash',
    method: 'GET',
    path: '/api/scan/hash',
    title: 'File Hash Threat Query',
    description: 'Queries VirusTotal malware detection records for an MD5, SHA-1, or SHA-256 file hash.',
    sampleParam: '?hash=275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f'
  },
  {
    id: 'scan-status',
    method: 'GET',
    path: '/api/scan/status',
    title: 'VirusTotal API Connection Status',
    description: 'Checks whether the VirusTotal API key is configured and operational.',
    sampleParam: ''
  },
  {
    id: 'dns',
    method: 'GET',
    path: '/api/dns',
    title: 'DNS Resolution Query',
    description: 'Queries authoritative DNS nameservers for A, AAAA, MX, NS, TXT, and PTR records simultaneously.',
    sampleParam: '?domain=example.com'
  },
  {
    id: 'ip',
    method: 'GET',
    path: '/api/ip',
    title: 'IP Inspection & Registry ASN',
    description: 'Inspects IPv4/IPv6 address scopes, resolves reverse PTR hostname, and fetches authentic public registry ASN/ISP details.',
    sampleParam: '?ip=8.8.8.8'
  },
  {
    id: 'reverse-dns',
    method: 'GET',
    path: '/api/reverse-dns',
    title: 'Reverse DNS (PTR)',
    description: 'Performs dedicated reverse PTR lookup mapping an IP back to its canonical domain hostname.',
    sampleParam: '?ip=8.8.8.8'
  },
  {
    id: 'email',
    method: 'GET',
    path: '/api/email',
    title: 'Email Domain Verification',
    description: 'Validates RFC 5322 email syntax, tests domain reachability, queries MX mail exchangers, and inspects SPF records.',
    sampleParam: '?email=user@gmail.com'
  },
  {
    id: 'whois',
    method: 'GET',
    path: '/api/whois',
    title: 'WHOIS & RDAP Domain Data',
    description: 'Dual-protocol domain registration queries utilizing modern ICANN RDAP (RFC 7482) and RFC 3912 TCP sockets.',
    sampleParam: '?domain=example.com'
  },
  {
    id: 'history',
    method: 'GET',
    path: '/api/history',
    title: 'Audit History Log',
    description: 'Retrieves logged investigation records with query search and module filtering support.',
    sampleParam: '?limit=10'
  },
  {
    id: 'health',
    method: 'GET',
    path: '/api/health',
    title: 'System Health & Engine Status',
    description: 'Reports server status, uptime, Node.js version, and Supabase PostgreSQL connection state.',
    sampleParam: ''
  }
];

export default function ApiDocs() {
  const { user } = useAuth();
  const [selectedEndpoint, setSelectedEndpoint] = useState(ENDPOINTS[0]);
  const [customParam, setCustomParam] = useState(selectedEndpoint.sampleParam);
  const [customBody, setCustomBody] = useState(selectedEndpoint.defaultBody || '');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [latency, setLatency] = useState(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const handleSelect = (ep) => {
    setSelectedEndpoint(ep);
    setCustomParam(ep.sampleParam || '');
    setCustomBody(ep.defaultBody || '');
    setResponse(null);
    setLatency(null);
  };

  const handleSendTest = async () => {
    setLoading(true);
    setResponse(null);
    const start = performance.now();

    try {
      let url = selectedEndpoint.path;
      const options = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (user?.apiKey) {
        options.headers['Authorization'] = `Bearer ${user.apiKey}`;
      }

      if (selectedEndpoint.method === 'POST') {
        options.body = customBody;
      } else if (customParam) {
        url += customParam;
      }

      const res = await fetch(url, options);
      const data = await res.json();
      const duration = Math.round(performance.now() - start);
      setLatency(duration);
      setResponse({ status: res.status, data });
    } catch (err) {
      setResponse({ status: 500, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const generatedCurl = selectedEndpoint.method === 'POST'
    ? `curl -X POST "http://localhost:5000${selectedEndpoint.path}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${user?.apiKey || 'YOUR_API_KEY'}" \\
  -d '${customBody.replace(/\n/g, '')}'`
    : `curl -X GET "http://localhost:5000${selectedEndpoint.path}${customParam}" \\
  -H "Authorization: Bearer ${user?.apiKey || 'YOUR_API_KEY'}"`;

  return (
    <div className="api-docs-page space-y-6">
      {/* Hero Header */}
      <section className="lookup-hero">
        <div className="lookup-hero-header">
          <div className="page-badge mb-2">Developer & Automation Console</div>
          <h2>
            <Code2 className="text-cyan" size={28} />
            <span>Interactive REST API Documentation</span>
          </h2>
          <p>
            Programmatically query DNS, IP, WHOIS, Email, and Universal Search from external scripts and SIEM pipelines.
          </p>
        </div>
      </section>

      {/* Main Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Endpoint Selector Sidebar */}
        <div className="lg:col-span-4 cyber-card p-3 space-y-1">
          <div className="text-xs font-bold text-muted uppercase px-3 py-2">
            Available Endpoints
          </div>
          {ENDPOINTS.map((ep) => {
            const isSelected = selectedEndpoint.id === ep.id;
            return (
              <button
                key={ep.id}
                type="button"
                className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-inner border border-cyan-500/40 text-primary'
                    : 'text-secondary hover:text-primary hover:bg-slate-100'
                }`}
                onClick={() => handleSelect(ep)}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        ep.method === 'POST' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-xs font-bold font-mono">{ep.path}</span>
                  </div>
                  <div className="text-[11px] text-muted">{ep.title}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Console Details & Playground */}
        <div className="lg:col-span-8 cyber-card p-5 space-y-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                  selectedEndpoint.method === 'POST' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {selectedEndpoint.method}
              </span>
              <h2 className="text-lg font-bold text-white font-mono">{selectedEndpoint.path}</h2>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              {selectedEndpoint.description}
            </p>
          </div>

          {/* Parameters / Body Editor */}
          <div className="space-y-3 p-4 rounded-lg bg-inner border border-subtle">
            <div className="text-xs font-bold text-white">
              {selectedEndpoint.method === 'POST' ? 'Request Payload (JSON)' : 'Query Parameters'}
            </div>

            {selectedEndpoint.method === 'POST' ? (
              <textarea
                className="w-full bg-white border border-subtle rounded p-2.5 font-mono text-xs text-primary resize-y min-h-[80px]"
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
              />
            ) : (
              <div className="input-with-icon">
                <input
                  type="text"
                  className="form-input font-mono text-xs"
                  placeholder="?param=value"
                  value={customParam}
                  onChange={(e) => setCustomParam(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                className="btn btn-primary text-xs"
                onClick={handleSendTest}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    <span>Sending Query...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Send Test Request</span>
                  </>
                )}
              </button>

              {latency !== null && (
                <span className="text-xs font-mono text-emerald flex items-center gap-1">
                  ✓ HTTP {response?.status} ({latency}ms)
                </span>
              )}
            </div>
          </div>

          {/* cURL Command Generator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted font-bold uppercase flex items-center gap-1.5">
                <Terminal size={14} className="text-cyan" />
                <span>Generated cURL Command</span>
              </span>
              <button
                type="button"
                className="btn btn-secondary py-1 px-2 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(generatedCurl);
                  setCopiedCurl(true);
                  setTimeout(() => setCopiedCurl(false), 2000);
                }}
              >
                {copiedCurl ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                <span>{copiedCurl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-50 border border-subtle font-mono text-xs text-slate-800 overflow-x-auto whitespace-pre-wrap break-all">
              <code>{generatedCurl}</code>
            </pre>
          </div>

          {/* Response Console */}
          {response && (
            <div>
              <div className="text-xs text-muted font-bold uppercase mb-1.5">
                Live Response Body
              </div>
              <pre className="p-3 rounded-lg bg-slate-50 border border-subtle font-mono text-xs text-sky-700 max-h-[300px] overflow-y-auto overflow-x-auto whitespace-pre-wrap break-all">
                <code>{JSON.stringify(response.data || response, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
