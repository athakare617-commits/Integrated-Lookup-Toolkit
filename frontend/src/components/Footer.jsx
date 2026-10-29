import React from 'react';
import { ShieldCheck, ExternalLink, BookOpen, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const auth = useAuth();
  const isAdmin = auth?.isAdmin;
  return (
    <footer className="cyber-footer">
      <div className="footer-content">
        <div className="footer-col-main">
          <div className="footer-brand">
            <ShieldCheck size={20} className="text-emerald" />
            <span className="footer-title">Integrated Lookup Toolkit</span>
          </div>
          <p className="footer-tagline">“Multiple Lookups. One Toolkit.”</p>
          <p className="footer-desc">
            A unified cybersecurity platform designed to unify DNS, IP, Reverse DNS, Email-domain, WHOIS, and Name lookups into a single, intuitive interface.
          </p>
          <div className="footer-safety-note">
            <span className="pulse-dot" />
            <span>Authorized Defensive Analysis & Diagnostic Utility</span>
          </div>
        </div>

        <div className="footer-col">
          <div className="footer-heading">TOOLKIT MODULES</div>
          <ul className="footer-links">
            <li><Link to="/integrated-lookup">Integrated Lookup (All Tools)</Link></li>
            <li><Link to="/integrated-lookup?type=dns">DNS Records (A, MX, NS, TXT)</Link></li>
            <li><Link to="/integrated-lookup?type=ip">IP Network & Geolocation</Link></li>
            <li><Link to="/integrated-lookup?type=reverse-dns">Reverse DNS / PTR</Link></li>
            <li><Link to="/integrated-lookup?type=email">Email Domain & MX Check</Link></li>
            <li><Link to="/integrated-lookup?type=whois">WHOIS Domain Registration</Link></li>
            <li><Link to="/integrated-lookup?type=name">Name & OSINT Entities</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <div className="footer-heading">SYSTEM & ARCHITECTURE</div>
          <ul className="footer-links">
            {isAdmin && <li><Link to="/history">Lookup History & Logs</Link></li>}
            {isAdmin && <li><Link to="/dashboard">SOC Security Dashboard</Link></li>}
            <li><Link to="/about">Architecture & Stack</Link></li>
            <li><Link to="/about">DNS Record Reference</Link></li>
            <li><a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase PostgreSQL <ExternalLink size={12} /></a></li>
            <li><a href="https://nodejs.org" target="_blank" rel="noopener noreferrer">Node.js DNS Engine <ExternalLink size={12} /></a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>
          Unified Cyber Security Investigation Platform. Strictly for authorized networking and security analysis.
        </div>
        <div className="footer-meta">
          <span>React + Vite</span>
          <span>•</span>
          <span>Express REST API</span>
          <span>•</span>
          <span>Supabase</span>
        </div>
      </div>

      <style>{`
        .cyber-footer {
          background: #ffffff;
          border-top: 1px solid var(--border-subtle);
          padding: 3rem 2.25rem 1.5rem 2.25rem;
          margin-top: auto;
          color: var(--text-secondary);
          font-size: 0.85rem;
          position: relative;
        }
        .footer-content {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 3rem;
          margin-bottom: 2.25rem;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          color: var(--text-primary);
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.15rem;
          letter-spacing: -0.01em;
        }
        .text-emerald {
          color: var(--accent-emerald);
        }
        .footer-tagline {
          font-size: 0.85rem;
          color: var(--accent-cyan);
          font-style: italic;
          margin: 0.35rem 0 0.85rem 0;
          font-weight: 500;
        }
        .footer-desc {
          line-height: 1.6;
          color: var(--text-secondary);
          max-width: 500px;
          font-size: 0.875rem;
        }
        .footer-safety-note {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          margin-top: 1.25rem;
          padding: 0.4rem 0.85rem;
          border-radius: var(--radius-sm);
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          font-size: 0.75rem;
          color: #059669;
          font-family: var(--font-mono);
          letter-spacing: 0.02em;
          font-weight: 500;
        }
        .footer-heading {
          font-size: 0.725rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
          margin-bottom: 1.15rem;
        }
        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .footer-links a {
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.15s ease, transform 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          padding: 0.25rem 0;
          min-height: 32px;
        }
        .footer-links a:hover {
          color: var(--accent-cyan);
          transform: translateX(2px);
        }
        .footer-bottom {
          max-width: 1400px;
          margin: 0 auto;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.775rem;
          color: var(--text-muted);
        }
        .footer-meta {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-mono);
          flex-wrap: wrap;
        }
        @media (max-width: 900px) {
          .cyber-footer {
            padding: 2.25rem 1.25rem 1.25rem 1.25rem;
          }
          .footer-content {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
        @media (max-width: 640px) {
          .cyber-footer {
            padding: 1.75rem 0.85rem 1rem 0.85rem;
          }
          .footer-content {
            gap: 1.5rem;
            margin-bottom: 1.5rem;
          }
          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .footer-safety-note {
            font-size: 0.7rem;
            padding: 0.35rem 0.65rem;
          }
        }
      `}</style>
    </footer>
  );
}
