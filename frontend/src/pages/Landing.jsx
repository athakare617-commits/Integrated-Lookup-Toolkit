import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Layers,
  Globe,
  Network,
  CornerDownRight,
  Mail,
  FileSearch,
  UserCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Server,
  Database,
  Terminal,
  Activity,
  Code2,
  ExternalLink,
  ChevronRight,
  Search,
  Cpu,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const [quickQuery, setQuickQuery] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      navigate('/integrated-lookup', { state: { initialQuery: quickQuery.trim(), initialType: 'auto' } });
    } else {
      navigate('/integrated-lookup');
    }
  };

  const sampleTargets = [
    { label: '8.8.8.8', desc: 'Google Public DNS' },
    { label: 'cloudflare.com', desc: 'Domain Records' },
    { label: 'security@cert.org', desc: 'Email Verification' },
    { label: '1.1.1.1', desc: 'Cloudflare Resolver' }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-glow-blob" />
        <div className="hero-grid-overlay" />

        <div className="landing-hero-content">


          <h1 className="hero-headline">
            Multiple Lookups.<br />
            <span className="text-gradient-cyan">One Unified Toolkit.</span>
          </h1>

          <p className="hero-description">
            Consolidate your digital reconnaissance, DNS inspection, IP classification, email deliverability, and WHOIS domain audits into a single, high-speed defensive platform. No more tab clutter or fragmented tools.
          </p>

          {/* Instant Lookup Sandbox on Landing Page */}
          <form className="landing-search-box" onSubmit={handleQuickSearch}>
            <div className="landing-input-wrap">
              <Search className="text-cyan ml-3" size={22} />
              <input
                type="text"
                className="landing-input font-mono"
                placeholder="Enter domain, IPv4/IPv6, email address, or name (e.g. 8.8.8.8)..."
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary landing-search-btn">
              <span>Execute Lookup</span>
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick Target Chips */}
          <div className="hero-quick-chips">
            <span className="text-xs text-muted font-mono uppercase tracking-wider">Quick Try:</span>
            {sampleTargets.map((item) => (
              <button
                key={item.label}
                type="button"
                className="quick-chip font-mono"
                onClick={() => {
                  setQuickQuery(item.label);
                  navigate('/integrated-lookup', { state: { initialQuery: item.label, initialType: 'auto' } });
                }}
              >
                <span>{item.label}</span>
                <span className="chip-sub">({item.desc})</span>
              </button>
            ))}
          </div>

          {/* Primary Action Buttons */}
          <div className="hero-cta-group">
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              <Activity size={20} />
              <span>Launch Dashboard</span>
              <ArrowRight size={18} />
            </Link>

            <Link to="/integrated-lookup" className="btn btn-secondary btn-lg">
              <Layers size={20} />
              <span>Integrated Search</span>
            </Link>

            {!isAuthenticated ? (
              <Link to="/login" className="btn btn-secondary btn-lg">
                <Lock size={18} />
                <span>Analyst Portal</span>
              </Link>
            ) : (
              <Link to="/profile" className="btn btn-secondary btn-lg">
                <UserCheck size={18} />
                <span>Analyst Profile</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Trust & Live Architecture Stats */}
      <section className="stats-ticker-bar">
        <div className="ticker-item">
          <span className="ticker-val">7-in-1</span>
          <span className="ticker-label">Consolidated Tools</span>
        </div>
        <div className="ticker-divider" />
        <div className="ticker-item">
          <span className="ticker-val">VirusTotal v3</span>
          <span className="ticker-label">Threat Intelligence</span>
        </div>
        <div className="ticker-divider" />
        <div className="ticker-item">
          <span className="ticker-val">&lt; 150ms</span>
          <span className="ticker-label">Parallel DNS Resolution</span>
        </div>
        <div className="ticker-divider" />
        <div className="ticker-item">
          <span className="ticker-val">RFC Compliant</span>
          <span className="ticker-label">Zero-Exploitation Standard</span>
        </div>
      </section>

      {/* Modular Feature Deep-Dive */}
      <section className="landing-section">
        <div className="section-header text-center">
          <h2 className="section-heading">Engineered for High-Precision Network Intelligence</h2>
          <p className="section-subheading">
            Every module is crafted to give cybersecurity analysts, network engineers, and students deep insights without executing risky shell commands.
          </p>
        </div>

        <div className="feature-cards-grid">
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="feature-card-header">
              <div className="feature-icon bg-cyan-soft">
                <Layers size={24} className="text-cyan" />
              </div>
              <span className="feature-tag">Universal</span>
            </div>
            <h3>Integrated Lookup</h3>
            <p>
              Smart automatic pattern detection engine that instantly identifies whether you pasted an IP, Domain, Email, or Name and routes to the appropriate resolver.
            </p>
            <ul className="feature-checklist">
              <li><CheckCircle2 size={14} /> Zero manual mode toggling required</li>
              <li><CheckCircle2 size={14} /> Instant live pattern feedback</li>
              <li><CheckCircle2 size={14} /> Comprehensive structured JSON output</li>
            </ul>
            <Link to="/integrated-lookup" className="feature-card-link">
              <span>Open Integrated Lookup</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <div className="feature-card-header">
              <div className="feature-icon bg-indigo-soft">
                <Globe size={24} className="text-indigo-400" />
              </div>
              <span className="feature-tag">DNS Core</span>
            </div>
            <h3>Deep DNS Resolution</h3>
            <p>
              Queries authoritative nameservers in parallel to extract A, AAAA, MX, NS, TXT (SPF/DKIM), and PTR records with educational explanations of each record type.
            </p>
            <ul className="feature-checklist">
              <li><CheckCircle2 size={14} /> Parallel asynchronous resolution</li>
              <li><CheckCircle2 size={14} /> Mail exchange priority hierarchy</li>
              <li><CheckCircle2 size={14} /> SPF security text policy analysis</li>
            </ul>
            <Link to="/integrated-lookup?type=dns" className="feature-card-link">
              <span>Inspect DNS Records</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <div className="feature-card-header">
              <div className="feature-icon bg-emerald-soft">
                <Network size={24} className="text-emerald" />
              </div>
              <span className="feature-tag">Network Layer</span>
            </div>
            <h3>IP & Reverse PTR Intelligence</h3>
            <p>
              Inspects IPv4 and IPv6 addresses, classifies subnet routing scopes (RFC 1918 Private, APIPA, Loopback, Public), resolves reverse hostnames, and queries live public registry ASN.
            </p>
            <ul className="feature-checklist">
              <li><CheckCircle2 size={14} /> Authentic registry ASN & ISP data</li>
              <li><CheckCircle2 size={14} /> Strict RFC 1918 subnet detection</li>
              <li><CheckCircle2 size={14} /> Dedicated Reverse PTR querying</li>
            </ul>
            <Link to="/integrated-lookup?type=ip" className="feature-card-link">
              <span>Analyze IP Address</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Feature 4 */}
          <div className="feature-card">
            <div className="feature-card-header">
              <div className="feature-icon bg-amber-soft">
                <Mail size={24} className="text-amber-400" />
              </div>
              <span className="feature-tag">Deliverability</span>
            </div>
            <h3>Email Domain Verification</h3>
            <p>
              Defensive technical email audit verifying RFC 5322 syntax compliance, domain infrastructure reachability, MX mail exchange routing, and SPF policy records.
            </p>
            <ul className="feature-checklist">
              <li><CheckCircle2 size={14} /> RFC 5322 format validation</li>
              <li><CheckCircle2 size={14} /> Authoritative MX availability</li>
              <li><CheckCircle2 size={14} /> Zero private mailbox intrusion</li>
            </ul>
            <Link to="/integrated-lookup?type=email" className="feature-card-link">
              <span>Verify Email Domain</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Feature 5 */}
          <div className="feature-card">
            <div className="feature-card-header">
              <div className="feature-icon bg-rose-soft">
                <FileSearch size={24} className="text-rose-400" />
              </div>
              <span className="feature-tag">Registry</span>
            </div>
            <h3>WHOIS & RDAP Domain Data</h3>
            <p>
              Dual-protocol domain registration queries utilizing modern ICANN RDAP (RFC 7482) with fallback to raw RFC 3912 TCP port 43 sockets for registrar, dates, and status.
            </p>
            <ul className="feature-checklist">
              <li><CheckCircle2 size={14} /> Modern JSON RDAP parsing</li>
              <li><CheckCircle2 size={14} /> TCP socket RFC 3912 fallback</li>
              <li><CheckCircle2 size={14} /> Expiration & registrar audit</li>
            </ul>
            <Link to="/integrated-lookup?type=whois" className="feature-card-link">
              <span>Run WHOIS Lookup</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Feature 6 */}
          <div className="feature-card">
            <div className="feature-card-header">
              <div className="feature-icon bg-purple-soft">
                <Database size={24} className="text-purple-400" />
              </div>
              <span className="feature-tag">Forensics</span>
            </div>
            <h3>Audit History & Analytics</h3>
            <p>
              Automated audit logging of all investigation queries with timestamped findings, instant re-run capability, module filtering, and Supabase PostgreSQL persistence.
            </p>
            <ul className="feature-checklist">
              <li><CheckCircle2 size={14} /> Chronological investigation history</li>
              <li><CheckCircle2 size={14} /> High-performance local cache fallback</li>
              <li><CheckCircle2 size={14} /> One-click query re-run</li>
            </ul>
            <Link to="/history" className="feature-card-link">
              <span>View Audit History</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="landing-section comparison-section">
        <div className="section-header text-center">
          <div className="page-badge mb-2">Workflow Comparison</div>
          <h2 className="section-heading">Why Choose Integrated Lookup Toolkit?</h2>
          <p className="section-subheading">
            See how the Integrated Lookup Toolkit revolutionizes network investigations compared to old, fragmented workflows.
          </p>
        </div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Investigation Aspect</th>
                <th className="highlight-column">Integrated Lookup Toolkit</th>
                <th>Traditional Multi-Tab Workflow</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold text-white">Target Investigation</td>
                <td className="highlight-cell text-cyan font-bold">Universal single search bar with auto-detection</td>
                <td className="text-secondary">Visiting 5-6 different third-party websites</td>
              </tr>
              <tr>
                <td className="font-semibold text-white">Execution Safety</td>
                <td className="highlight-cell text-cyan font-bold">100% native Node.js APIs (zero shell command execution)</td>
                <td className="text-secondary">Manual terminal scripts prone to command injection</td>
              </tr>
              <tr>
                <td className="font-semibold text-white">Data Integrity</td>
                <td className="highlight-cell text-cyan font-bold">Real live registry queries (zero synthetic/fabricated data)</td>
                <td className="text-secondary">Ad-ridden websites often serving cached or fake data</td>
              </tr>
              <tr>
                <td className="font-semibold text-white">Audit & Forensics</td>
                <td className="highlight-cell text-cyan font-bold">Automated query history logging & export</td>
                <td className="text-secondary">Manual copy-pasting into text files</td>
              </tr>
              <tr>
                <td className="font-semibold text-white">Developer API</td>
                <td className="highlight-cell text-cyan font-bold">Full REST API with personal API keys & playground</td>
                <td className="text-secondary">Expensive commercial subscription APIs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Architecture & Defensive Standards */}
      <section className="landing-section tech-architecture-section">
        <div className="cyber-card p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="page-badge mb-3">Defensive Cybersecurity Standards</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Built on Educational & Ethical Reconnaissance Principles
              </h2>
              <p className="text-secondary text-sm leading-relaxed mb-4">
                The Integrated Lookup Toolkit strictly enforces a <strong>Zero-Exploitation Policy</strong>. All modules focus exclusively on defensive intelligence, network verification, and protocol diagnostics according to official RFC specifications.
              </p>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Lock className="text-emerald mt-1 flex-shrink-0" size={18} />
                  <div>
                    <strong className="text-white">Strict Privacy Preservation:</strong>
                    <span className="text-secondary block text-xs">Does not scrape, harvest, or display personal identifying information (PII).</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Server className="text-cyan mt-1 flex-shrink-0" size={18} />
                  <div>
                    <strong className="text-white">Command Injection Prevention:</strong>
                    <span className="text-secondary block text-xs">DNS and WHOIS are queried through native TCP sockets and language bindings, avoiding shell sub-processes.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Database className="text-purple-400 mt-1 flex-shrink-0" size={18} />
                  <div>
                    <strong className="text-white">Dual-Mode Persistence:</strong>
                    <span className="text-secondary block text-xs">Seamlessly operates with enterprise Supabase PostgreSQL or zero-config local memory cache.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="terminal-card">
              <div className="terminal-header">
                <div className="terminal-buttons">
                  <span className="t-btn t-red" />
                  <span className="t-btn t-yellow" />
                  <span className="t-btn t-green" />
                </div>
                <span className="terminal-title">iltk-analyst-terminal</span>
              </div>
              <div className="terminal-body font-mono text-xs">
                <p className="text-muted">$ iltk inspect 8.8.8.8 --mode=integrated</p>
                <p className="text-cyan mt-1">[✓] Target Type: IPv4 Address</p>
                <p className="text-secondary">[✓] Scope: Public Internet Routable</p>
                <p className="text-secondary">[✓] Reverse PTR: dns.google</p>
                <p className="text-emerald">[✓] ASN: AS15169 Google LLC</p>
                <p className="text-emerald">[✓] Region: Ashburn, Virginia (US)</p>
                <p className="text-muted mt-2">$ iltk inspect cloudflare.com --records=all</p>
                <p className="text-cyan mt-1">[✓] Resolved 6 record sets in 48ms</p>
                <p className="text-secondary">[✓] A: 104.16.132.229, 104.16.133.229</p>
                <p className="text-secondary">[✓] MX: mx.cloudflare.com (Pri: 0)</p>
                <p className="text-emerald">[✓] Audit record committed to database.</p>
                <div className="terminal-cursor" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Card */}
      <section className="landing-cta-banner">
        <div className="cta-content">
          <h2>Ready to Unify Your Investigation Workflow?</h2>
          <p>Launch the Integrated Lookup Toolkit right in your browser or explore the interactive API documentation.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap mt-6">
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              <span>Open Dashboard</span>
              <ArrowRight size={18} />
            </Link>

            <Link to="/api-docs" className="btn btn-secondary btn-lg">
              <Code2 size={18} />
              <span>Interactive API Docs</span>
            </Link>

            {!isAuthenticated && (
              <Link to="/signup" className="btn btn-secondary btn-lg">
                <UserCheck size={18} />
                <span>Create Analyst Account</span>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
