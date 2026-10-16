import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  History,
  Info,
  Shield,
  X,
  Home,
  Code2,
  User,
  Menu,
  FileText
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dashboard?tab=logs', label: 'Activity Logs', icon: FileText },
  { path: '/integrated-lookup', label: 'Integrated Lookup', icon: Layers, highlight: true },
  { path: '/history', label: 'Lookup History', icon: History },
  { path: '/api-docs', label: 'API Documentation', icon: Code2 },
  { path: '/profile', label: 'Analyst Profile', icon: User },
  { path: '/about', label: 'About & Help', icon: Info },
];

export default function Sidebar({ isHidden, onToggle, isOpen, onClose }) {
  const location = useLocation();

  const isItemActive = (itemPath) => {
    if (itemPath.includes('?')) {
      const [path, query] = itemPath.split('?');
      return location.pathname === path && location.search.includes(query);
    }
    if (itemPath === '/dashboard') {
      return location.pathname === '/dashboard' && !location.search.includes('tab=logs');
    }
    return location.pathname === itemPath;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`cyber-sidebar ${isHidden ? 'hidden' : ''} ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-badge">
            <div className="sidebar-brand-icon-box">
              <Shield size={20} className="text-cyan" />
            </div>
            <div className="sidebar-brand-text">
              <span className="brand-primary">LOOKUP</span>
              <span className="brand-accent">TOOLKIT</span>
            </div>
          </div>

          {/* Toggle button in sidebar header */}
          <button
            className="sidebar-toggle-btn"
            onClick={() => {
              if (window.innerWidth <= 900) {
                onClose();
              } else {
                onToggle();
              }
            }}
            aria-label={window.innerWidth <= 900 ? "Close sidebar" : "Hide sidebar"}
            title={window.innerWidth <= 900 ? "Close sidebar" : "Hide sidebar"}
          >
            <Menu size={18} className="desktop-toggle-icon" />
            <X size={18} className="mobile-close-icon" />
          </button>
        </div>

        <div className="sidebar-tagline">
          “Multiple Lookups. One Toolkit.”
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">INVESTIGATION SUITE</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                title={item.label}
                className={() =>
                  `nav-link ${active ? 'active' : ''} ${item.highlight ? 'nav-highlight' : ''}`
                }
                onClick={() => {
                  if (window.innerWidth <= 900) onClose();
                }}
              >
                <Icon size={18} className="nav-icon" />
                <span className="nav-text">{item.label}</span>
                {item.highlight && <span className="nav-chip">MAIN</span>}
                {item.badge && <span className="nav-chip" style={{ background: '#059669' }}>{item.badge}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <style>{`
        .cyber-sidebar {
          width: var(--sidebar-width);
          background: #ffffff;
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 50;
          box-shadow: var(--shadow-sm);
          flex-shrink: 0;
          transition: margin-left 0.28s cubic-bezier(0.2, 0, 0, 1), transform 0.28s ease;
        }

        .cyber-sidebar.hidden {
          margin-left: calc(-1 * var(--sidebar-width));
        }

        .sidebar-header {
          padding: 0 1.15rem;
          height: var(--navbar-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
          background: #ffffff;
          box-sizing: border-box;
          flex-shrink: 0;
          gap: 1.25rem;
        }

        .sidebar-brand-badge {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
        }

        .sidebar-brand-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sidebar-brand-text {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.05rem;
          letter-spacing: -0.015em;
          white-space: nowrap;
        }

        .brand-primary {
          color: var(--text-primary);
        }

        .brand-accent {
          color: var(--accent-cyan);
          margin-left: 2px;
        }

        .sidebar-toggle-btn {
          background: #f8fafc;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          flex-shrink: 0;
          margin-left: auto;
        }

        .sidebar-toggle-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: var(--text-primary);
        }

        .sidebar-toggle-btn:active {
          transform: scale(0.95);
        }

        .desktop-toggle-icon {
          display: block;
        }

        .mobile-close-icon {
          display: none;
        }

        .sidebar-tagline {
          padding: 0.55rem 1.25rem;
          font-size: 0.725rem;
          color: var(--text-muted);
          font-style: italic;
          background: #f8fafc;
          border-bottom: 1px solid var(--border-subtle);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex-shrink: 0;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem 0.75rem;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .nav-group-label {
          font-size: 0.675rem;
          font-weight: 700;
          color: var(--text-muted);
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
          padding: 0.65rem 0.85rem 0.35rem 0.85rem;
          white-space: nowrap;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.85rem;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.15s ease;
          position: relative;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .nav-icon {
          flex-shrink: 0;
        }

        .nav-link:hover {
          color: var(--text-primary);
          background: #f1f5f9;
        }

        .nav-link.active {
          color: var(--accent-cyan);
          background: #f0f9ff;
          border-color: #bae6fd;
          font-weight: 600;
        }

        .nav-link.active .nav-icon {
          color: var(--accent-cyan);
        }

        .nav-highlight {
          border: 1px solid #bae6fd;
          background: #f0f9ff;
        }

        .nav-chip {
          margin-left: auto;
          font-size: 0.65rem;
          font-weight: 700;
          font-family: var(--font-mono);
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          background: var(--accent-cyan);
          color: #ffffff;
          flex-shrink: 0;
        }

        /* Mobile Responsive */
        @media (max-width: 900px) {
          .desktop-toggle-icon {
            display: none !important;
          }
          .mobile-close-icon {
            display: block !important;
          }
          .cyber-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            width: min(280px, calc(100vw - 48px)) !important;
            max-width: calc(100vw - 32px);
            margin-left: 0 !important;
            transform: translateX(-105%);
            transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 1000;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          }
          .cyber-sidebar.open {
            transform: translateX(0);
          }
          .sidebar-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.5);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 999;
          }
          .nav-link {
            min-height: 44px;
            padding: 0.75rem 0.85rem;
          }
          .sidebar-toggle-btn {
            width: 36px;
            height: 36px;
          }
        }
        @media (max-width: 360px) {
          .cyber-sidebar {
            width: calc(100vw - 36px) !important;
          }
          .sidebar-brand-text {
            font-size: 0.95rem;
          }
        }
      `}</style>
    </>
  );
}
