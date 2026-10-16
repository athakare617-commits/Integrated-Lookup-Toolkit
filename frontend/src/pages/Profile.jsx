import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Key,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  LogOut,
  History,
  Eye,
  EyeOff,
  Code2,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Users,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Profile() {
  const { user, logout, regenerateApiKey, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [copiedKey, setCopiedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [keyRegenerating, setKeyRegenerating] = useState(false);
  const [defaultMode, setDefaultMode] = useState('auto');
  const [autoSaveHistory, setAutoSaveHistory] = useState(true);
  const [savedSettings, setSavedSettings] = useState(false);

  // Administrator user list state
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchAdminUsers = async () => {
    if (user?.role === 'Administrator') {
      try {
        setLoadingUsers(true);
        const res = await api.getAllUsers();
        if (res.success && Array.isArray(res.users)) {
          setAdminUsers(res.users);
        }
      } catch (err) {
        console.warn('Could not fetch admin user list:', err.message);
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, [user?.role]);

  if (!user) {
    return (
      <div className="profile-page">
        <div className="cyber-card text-center py-12 max-w-md mx-auto">
          <Shield size={48} className="text-cyan mx-auto mb-3 opacity-60" />
          <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-secondary text-sm mb-6">
            Please sign in to access your analyst profile, personal API keys, and investigation preferences.
          </p>
          <Link to="/login" className="btn btn-primary">
            <span>Go to Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleCopyKey = () => {
    if (user.apiKey) {
      navigator.clipboard.writeText(user.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleRegenerate = async () => {
    if (window.confirm('Are you sure you want to regenerate your API key? Any active scripts using the old key will need to be updated.')) {
      try {
        setKeyRegenerating(true);
        await regenerateApiKey();
      } finally {
        setKeyRegenerating(false);
      }
    }
  };

  const handleSavePreferences = (e) => {
    e.preventDefault();
    updateProfile({ defaultMode, autoSaveHistory });
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const sampleCurl = `curl -X GET "http://localhost:5000/api/dns?domain=example.com" \\
  -H "Authorization: Bearer ${user.apiKey || 'YOUR_API_KEY'}"`;

  return (
    <div className="profile-page space-y-6">
      {/* Header */}
      <section className="lookup-hero">
        <div className="lookup-hero-header flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="page-badge mb-2">Analyst Identity & Security</div>
            <h2>
              <User className="text-cyan" size={28} />
              <span>Analyst Profile & API Credentials</span>
            </h2>
            <p>Manage your account identity, personal automation API key, and investigation preferences.</p>
          </div>

          <button className="btn btn-danger text-xs" onClick={handleSignOut}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      {/* Identity Card */}
      <div className="cyber-card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`user-avatar-large ${user.role === 'Administrator' ? 'border-amber-400 text-amber-400' : ''}`}>
              {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                <span className={`page-badge text-xs ${user.role === 'Administrator' ? 'border-amber-400 text-amber-400 font-bold' : ''}`}>
                  {user.role === 'Administrator' ? '🛡️ Administrator' : (user.role || 'SOC Analyst')}
                </span>
              </div>
              <p className="text-secondary text-sm font-mono mt-0.5">{user.email}</p>
              <div className="text-xs text-muted mt-1 flex items-center gap-3">
                <span>Org: <strong className="text-white">{user.organization || 'Independent'}</strong></span>
                <span>•</span>
                <span>Account ID: <strong className="text-cyan font-mono">{user.id}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Link to="/history" className="btn btn-secondary text-xs flex-1 sm:flex-none justify-center">
              <History size={14} />
              <span>My Investigation History</span>
            </Link>
            <Link to="/dashboard" className="btn btn-primary text-xs flex-1 sm:flex-none justify-center">
              <Activity size={14} />
              <span>Open Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Administrator System Panel (Only for role === 'Administrator') */}
      {user.role === 'Administrator' && (
        <div className="cyber-card border-amber-500/40">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert size={20} className="text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white">System Administration & User Registry</h3>
                <p className="text-xs text-secondary">All registered analysts and security researchers persisted in database.</p>
              </div>
            </div>
            <button
              onClick={fetchAdminUsers}
              className="btn btn-secondary text-xs flex items-center gap-1.5"
              disabled={loadingUsers}
            >
              <RefreshCw size={13} className={loadingUsers ? 'animate-spin' : ''} />
              <span>Refresh Users</span>
            </button>
          </div>

          {adminUsers.length > 0 ? (
            <div className="table-wrapper">
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Organization</th>
                    <th>API Key Prefix</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="font-semibold text-white">{u.name}</td>
                      <td className="font-mono text-xs">{u.email}</td>
                      <td>
                        <span className={`page-badge text-[10px] ${u.role === 'Administrator' ? 'border-amber-400 text-amber-400 font-bold' : ''}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-secondary text-xs">{u.organization || 'Independent'}</td>
                      <td className="font-mono text-[11px] text-cyan">{u.apiKey ? u.apiKey.substring(0, 18) + '...' : 'N/A'}</td>
                      <td className="text-xs text-muted font-mono">{new Date(u.createdAt || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-inner border border-subtle text-xs text-secondary text-center">
              No additional registered users found.
            </div>
          )}
        </div>
      )}

      {/* API Key Management Card */}
      <div className="cyber-card">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Key size={20} className="text-cyan" />
              <h3 className="text-base font-bold text-white">Personal REST API Key</h3>
            </div>
            <p className="text-xs text-secondary mt-1">
              Use this key to authenticate terminal scripts, CI/CD pipelines, and defensive telemetry automation.
            </p>
          </div>

          <button
            onClick={handleRegenerate}
            disabled={keyRegenerating}
            className="btn btn-secondary text-xs flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={keyRegenerating ? 'animate-spin' : ''} />
            <span>Regenerate Key</span>
          </button>
        </div>

        {/* API Key Display Box */}
        <div className="p-3.5 rounded-lg bg-inner border border-subtle flex items-center justify-between gap-3 flex-wrap">
          <div className="font-mono text-sm tracking-wider text-cyan truncate flex-1 min-w-[200px] select-all">
            {showKey ? user.apiKey : '•'.repeat(36)}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowKey(!showKey)}
              title={showKey ? 'Hide API Key' : 'Show API Key'}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            <button
              type="button"
              className="btn btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
              onClick={handleCopyKey}
            >
              {copiedKey ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
              <span>{copiedKey ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Terminal usage snippet */}
        <div className="mt-4">
          <div className="text-xs text-muted font-bold uppercase mb-1.5 flex items-center gap-1.5">
            <Terminal size={14} className="text-cyan" />
            <span>Terminal Quick-Start Usage</span>
          </div>
          <div className="p-3 rounded-lg bg-[#040914] border border-subtle font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
            <code>{sampleCurl}</code>
          </div>
        </div>
      </div>

      {/* Investigation Preferences */}
      <div className="cyber-card">
        <div className="flex items-center gap-2 mb-4">
          <Sliders size={20} className="text-cyan" />
          <h3 className="text-base font-bold text-white">Investigation Preferences</h3>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label" htmlFor="pref-default-mode">Default Search Mode</label>
              <div className="search-select-wrapper w-full">
                <select
                  id="pref-default-mode"
                  value={defaultMode}
                  onChange={(e) => setDefaultMode(e.target.value)}
                  className="w-full text-xs"
                >
                  <option value="auto">Auto-Detect Input Pattern (Recommended)</option>
                  <option value="dns">Domain & DNS Inspection</option>
                  <option value="ip">IP & Network Classification</option>
                  <option value="whois">WHOIS Domain Registration</option>
                  <option value="email">Email Syntax & MX Routing</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pref-history-toggle">Audit Logging Policy</label>
              <label className="checkbox-label mt-2">
                <input
                  id="pref-history-toggle"
                  type="checkbox"
                  checked={autoSaveHistory}
                  onChange={(e) => setAutoSaveHistory(e.target.checked)}
                />
                <span className="text-xs text-secondary">
                  Automatically persist all my lookups to audit database
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-subtle">
            {savedSettings ? (
              <span className="text-xs text-emerald font-bold flex items-center gap-1">
                <Check size={14} /> Preferences saved successfully!
              </span>
            ) : <span />}

            <button type="submit" className="btn btn-primary text-xs">
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .user-avatar-large {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(14, 165, 233, 0.1) 100%);
          border: 1px solid var(--accent-cyan);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.25rem;
          color: var(--accent-cyan);
        }
      `}</style>
    </div>
  );
}
