import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onToggleSidebar, isSidebarHidden, isSidebarOpen }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="cyber-navbar">
      <div className="navbar-left">
        {/* Toggle button: visible only when authenticated and sidebar is hidden or on mobile */}
        {isAuthenticated && (
          <button
            className={`btn-icon sidebar-toggle-btn ${!isSidebarHidden ? 'hidden-on-desktop' : ''}`}
            onClick={onToggleSidebar}
            aria-label={isSidebarHidden ? "Show sidebar" : "Hide sidebar"}
            title={isSidebarHidden ? "Show sidebar" : "Hide sidebar"}
          >
            <Menu size={20} />
          </button>
        )}
        <Link to={isAuthenticated ? "/dashboard" : "/login"} className="navbar-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="navbar-brand-icon">
            <Shield size={20} className="text-cyan" />
          </div>
          <div>
            <div className="navbar-title">Integrated Lookup Toolkit</div>
            <div className="navbar-subtitle">Name, Email, IP, Domain/DNS & More</div>
          </div>
        </Link>
      </div>

      <div className="navbar-right">
        {/* User Auth Buttons / Profile Badge */}
        <div className="navbar-auth-section">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="nav-user-badge"
                title="View Analyst Profile & API Keys"
              >
                <div className="nav-avatar">
                  {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="nav-user-info">
                  <div className="flex items-center gap-1.5">
                    <span className="nav-user-name">{user.name}</span>
                    {user.role === 'Administrator' && (
                      <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <span className="nav-user-role">{user.role || 'Analyst'}</span>
                </div>
              </Link>
              <button
                onClick={logout}
                className="btn-icon text-rose-400 hover:text-rose-300"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="auth-buttons-group">
              <Link to="/login" className="btn btn-secondary nav-auth-btn">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary nav-auth-btn">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .cyber-navbar {
          height: var(--navbar-height);
          background: var(--bg-navbar);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          position: sticky;
          top: 0;
          z-index: 40;
          box-shadow: var(--shadow-sm);
          width: 100%;
          box-sizing: border-box;
        }
        .navbar-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 0;
          flex-shrink: 1;
        }
        .btn-icon {
          background: #f8fafc;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .btn-icon:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: var(--text-primary);
        }
        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          min-width: 0;
        }
        .navbar-brand-icon {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-sm);
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-cyan);
          flex-shrink: 0;
        }
        .navbar-title {
          font-family: var(--font-display);
          font-size: clamp(0.825rem, 2.5vw, 1.05rem);
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
          letter-spacing: -0.015em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .navbar-subtitle {
          font-size: 0.7rem;
          color: var(--text-muted);
          letter-spacing: 0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }
        .navbar-auth-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .auth-buttons-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .nav-auth-btn {
          padding: 0.42rem 0.9rem;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: var(--radius-md);
        }
        .nav-user-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-md);
          background: #f8fafc;
          border: 1px solid var(--border-subtle);
          transition: all 0.15s ease;
        }
        .nav-user-badge:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }
        .nav-avatar {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          color: var(--accent-cyan);
          font-weight: 800;
          font-family: var(--font-display);
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .nav-user-info {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }
        .nav-user-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .nav-user-role {
          font-size: 0.675rem;
          color: var(--accent-cyan);
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .sidebar-toggle-btn {
          background: #f8fafc;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .sidebar-toggle-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: var(--text-primary);
        }
        .sidebar-toggle-btn:active {
          transform: scale(0.95);
        }
        .sidebar-toggle-btn.is-hidden {
          background: #f0f9ff;
          border-color: #bae6fd;
          color: var(--accent-cyan);
        }
        .sidebar-toggle-btn.is-hidden:hover {
          background: #e0f2fe;
          border-color: #7dd3fc;
        }
        @media (min-width: 901px) {
          .sidebar-toggle-btn.hidden-on-desktop {
            display: none;
          }
        }
        @media (max-width: 900px) {
          .cyber-navbar {
            padding: 0 1rem;
          }
          .navbar-subtitle {
            display: none;
          }
          .nav-user-info {
            display: none;
          }
        }
        @media (max-width: 480px) {
          .cyber-navbar {
            padding: 0 0.65rem;
            height: 58px;
          }
          .navbar-left {
            gap: 0.5rem;
          }
          .navbar-brand-icon {
            width: 28px;
            height: 28px;
          }
          .btn-icon, .sidebar-toggle-btn {
            width: 34px;
            height: 34px;
          }
          .auth-buttons-group {
            gap: 0.35rem;
          }
          .nav-auth-btn {
            padding: 0.32rem 0.55rem;
            font-size: 0.75rem;
          }
          .nav-user-badge {
            padding: 0.25rem 0.45rem;
          }
        }
        @media (max-width: 360px) {
          .cyber-navbar {
            padding: 0 0.45rem;
          }
          .navbar-title {
            max-width: 110px;
          }
          .nav-auth-btn {
            padding: 0.28rem 0.45rem;
            font-size: 0.7rem;
          }
        }
      `}</style>
    </header>
  );
}
