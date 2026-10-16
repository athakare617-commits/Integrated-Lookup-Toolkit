import React from 'react';
import {
  Info,
  Shield,
  Layers,
  Globe,
  Network,
  CornerDownRight,
  Mail,
  FileSearch,
  UserCheck,
  Server,
  Database,
  Code2,
  Lock,
  CheckCircle2
} from 'lucide-react';

export default function About() {
  return (
    <div className="about-page space-y-6">
      {/* Header */}
      <section className="lookup-hero">
        <div className="lookup-hero-header">
          <div className="page-badge mb-2">Project Documentation & Reference</div>
          <h2>
            <Info className="text-cyan" size={28} />
            <span>About & Help Guide</span>
          </h2>
          <p>Defensive Cybersecurity & Network Diagnostics: Integrated Lookup Toolkit</p>
        </div>
      </section>

      {/* Project Overview */}
      <div className="cyber-card">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={20} className="text-cyan" />
          <h2 className="text-lg font-bold text-white">Project Overview</h2>
        </div>
        <p className="text-secondary text-sm leading-relaxed mb-4">
          <strong>Integrated Lookup Toolkit</strong> is a unified cybersecurity and networking investigation application that brings multiple lookup functions into one single easy-to-use interface instead of requiring analysts to visit different websites or use disparate command-line tools separately.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg bg-inner border border-subtle">
            <div className="text-xs text-muted font-bold uppercase mb-1">Project Purpose</div>
            <div className="text-white text-sm font-semibold">Defensive Cybersecurity Platform</div>
            <div className="text-xs text-secondary mt-1">Defensive reconnaissance and technical network diagnostics.</div>
          </div>
          <div className="p-3.5 rounded-lg bg-inner border border-subtle">
            <div className="text-xs text-muted font-bold uppercase mb-1">Tagline</div>
            <div className="text-cyan text-sm font-semibold">“Multiple Lookups. One Toolkit.”</div>
            <div className="text-xs text-secondary mt-1">Consolidated interface eliminating tool fatigue.</div>
          </div>
          <div className="p-3.5 rounded-lg bg-inner border border-subtle">
            <div className="text-xs text-muted font-bold uppercase mb-1">Security Standard</div>
            <div className="text-emerald text-sm font-semibold">Zero-Exploitation Policy</div>
            <div className="text-xs text-secondary mt-1">Strict adherence to ethical and defensive standards.</div>
          </div>
        </div>
      </div>

      {/* Technology Stack & Architecture */}
      <div className="cyber-card">
        <div className="flex items-center gap-2 mb-4">
          <Code2 size={20} className="text-cyan" />
          <h2 className="text-lg font-bold text-white">Application Architecture & Stack</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-inner border border-subtle">
            <div className="flex items-center gap-2 text-cyan font-bold mb-2">
              <Code2 size={16} />
              <span>Frontend Layer</span>
            </div>
            <ul className="space-y-1.5 text-xs text-secondary">
              <li>• <strong>React.js (v18+)</strong> with Functional Components & Hooks</li>
              <li>• <strong>React Router</strong> for client-side routing</li>
              <li>• <strong>Vanilla CSS</strong> custom Cyber Security design system</li>
              <li>• <strong>Lucide React</strong> for modern cybersecurity iconography</li>
              <li>• Fully responsive layout (desktop, tablet, mobile)</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-inner border border-subtle">
            <div className="flex items-center gap-2 text-cyan font-bold mb-2">
              <Server size={16} />
              <span>Backend Layer</span>
            </div>
            <ul className="space-y-1.5 text-xs text-secondary">
              <li>• <strong>Node.js & Express.js</strong> REST API service</li>
              <li>• <strong>Native Node.js DNS API</strong> (zero shell command execution)</li>
              <li>• <strong>RFC 3912 TCP WHOIS & RDAP</strong> clients</li>
              <li>• <strong>Rate Limiting</strong> middleware to prevent API abuse</li>
              <li>• Centralized error handling with sanitized user responses</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-inner border border-subtle">
            <div className="flex items-center gap-2 text-cyan font-bold mb-2">
              <Database size={16} />
              <span>Database Layer</span>
            </div>
            <ul className="space-y-1.5 text-xs text-secondary">
              <li>• <strong>Supabase PostgreSQL</strong> for persistence</li>
              <li>• Table: <code>lookup_history</code> with indexes & RLS</li>
              <li>• Real-time query history & aggregated analytics</li>
              <li>• Graceful in-memory fallback when credentials pending</li>
              <li>• Strict environment variable secret isolation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Educational Help & DNS Record Reference */}
      <div className="cyber-card">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={20} className="text-cyan" />
          <h2 className="text-lg font-bold text-white">DNS & Network Investigation Guide</h2>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-inner border border-subtle">
            <div className="text-white font-bold text-sm mb-1 flex items-center gap-2">
              <span className="page-badge">DNS</span>
              <span>What is DNS?</span>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              The Domain Name System (DNS) converts human-readable domain names (such as <code>example.com</code>) into numerical IP addresses (such as <code>93.184.216.34</code>), enabling network devices and internet services to locate and communicate with each other across global networks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-inner border border-subtle">
              <div className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                <span className="record-badge text-xs">A RECORD</span>
                <span>IPv4 Address Mapping</span>
              </div>
              <p className="text-xs text-secondary">
                Maps a domain name to an IPv4 address (32-bit format, e.g. <code>93.184.216.34</code>). This is the fundamental building block of web routing.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-inner border border-subtle">
              <div className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                <span className="record-badge text-xs">AAAA RECORD</span>
                <span>IPv6 Address Mapping</span>
              </div>
              <p className="text-xs text-secondary">
                Maps a domain name to an IPv6 address (128-bit hexadecimal format, e.g. <code>2606:2800:220:1:248:1893:25c8:1946</code>) for next-generation internet addressing.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-inner border border-subtle">
              <div className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                <span className="record-badge text-xs">MX RECORD</span>
                <span>Mail Exchange Routing</span>
              </div>
              <p className="text-xs text-secondary">
                Specifies the mail servers responsible for accepting incoming emails on behalf of a domain, ordered by priority preference values.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-inner border border-subtle">
              <div className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                <span className="record-badge text-xs">NS RECORD</span>
                <span>Authoritative Nameservers</span>
              </div>
              <p className="text-xs text-secondary">
                Identifies the authoritative DNS nameservers designated to respond to DNS queries for the domain zone.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-inner border border-subtle">
              <div className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                <span className="record-badge text-xs">TXT RECORD</span>
                <span>Text Information & Security Policies</span>
              </div>
              <p className="text-xs text-secondary">
                Stores machine-readable text associated with a domain, commonly used for SPF (Sender Policy Framework), DKIM, DMARC, and domain ownership verification.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-inner border border-subtle">
              <div className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                <span className="record-badge text-xs">PTR RECORD</span>
                <span>Pointer / Reverse DNS</span>
              </div>
              <p className="text-xs text-secondary">
                Performs reverse DNS lookups, mapping an IP address back to its canonical hostname using specialized in-addr.arpa or ip6.arpa DNS zones.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-inner border border-subtle">
            <div className="text-white font-bold text-sm mb-1 flex items-center gap-2">
              <span className="page-badge">WHOIS</span>
              <span>WHOIS & RDAP Domain Registration</span>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Provides available registration data regarding a domain name, including sponsoring registrar, registration creation date, last updated date, expiration date, and registered nameservers.
            </p>
          </div>
        </div>
      </div>

      {/* Security & Ethical Boundaries */}
      <div className="cyber-card border-emerald-800">
        <div className="flex items-center gap-2 mb-3">
          <Lock size={20} className="text-emerald" />
          <h2 className="text-lg font-bold text-white">Ethical Cybersecurity Standard</h2>
        </div>
        <p className="text-secondary text-xs leading-relaxed">
          In strict compliance with authorized defensive cybersecurity guidelines, this toolkit does NOT implement malicious or unauthorized functionality such as password cracking, credential theft, account hacking, malware deployment, vulnerability exploitation, unauthorized system access, private email mailbox snooping, or stealth monitoring.
        </p>
      </div>
    </div>
  );
}
