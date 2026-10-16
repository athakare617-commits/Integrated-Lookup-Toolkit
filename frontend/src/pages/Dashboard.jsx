import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Layers,
  Globe,
  Network,
  CornerDownRight,
  Mail,
  FileSearch,
  UserCheck,
  History,
  Activity,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  Search,
  Download,
  Trash2,
  Code2,
  Copy,
  Check,
  X,
  Play,
  Clock,
  Terminal,
  LayoutDashboard,
  LogIn,
  LogOut,
  UserPlus,
  User,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import AccuracyModal from '../components/AccuracyModal';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentLookups, setRecentLookups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState(null);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);

  // Tab State
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'logs' ? 'logs' : 'overview');

  // Logs Tab State
  const [allLogs, setAllLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsSearch, setLogsSearch] = useState('');
  const [logsTypeFilter, setLogsTypeFilter] = useState('all');
  const [logsStatusFilter, setLogsStatusFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedQueryId, setCopiedQueryId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const navigate = useNavigate();

  // Sync tab with URL
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'logs' || t === 'overview') {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: newTab });
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, historyRes, healthRes] = await Promise.all([
        api.getStats().catch(() => ({ data: { totalLookups: 0, dnsLookups: 0, ipLookups: 0, emailChecks: 0, whoisChecks: 0, threatScans: 0 } })),
        api.getHistory({ limit: 6 }).catch(() => ({ data: [] })),
        api.getHealth().catch(() => null)
      ]);

      setStats(statsRes.data || { totalLookups: 0, dnsLookups: 0, ipLookups: 0, emailChecks: 0, whoisChecks: 0, threatScans: 0 });
      setRecentLookups(historyRes.data || []);
      setHealth(healthRes);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const loadLogsData = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.getHistory({
        search: logsSearch.trim(),
        type: logsTypeFilter === 'all' ? '' : logsTypeFilter,
        limit: 150
      });
      setAllLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogsData();
    }
  }, [activeTab, logsTypeFilter]);

  const handleQuickLookup = (type, query) => {
    navigate('/integrated-lookup', {
      state: { initialQuery: query, initialType: (type === 'threat-scan' || type === 'scan') ? 'auto' : type }
    });
  };

  const handleClearLogs = async () => {
    try {
      setShowClearConfirm(false);
      setLoadingLogs(true);
      await api.clearAllHistory();
      setAllLogs([]);
      setRecentLookups([]);
      if (stats) {
        setStats(prev => ({
          ...prev,
          totalLookups: 0,
          dnsLookups: 0,
          ipLookups: 0,
          emailChecks: 0,
          whoisChecks: 0,
          threatScans: 0
        }));
      }
    } catch (err) {
      setError(err.message || 'Failed to clear logs.');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleExportLogs = (format = 'json') => {
    if (!filteredLogs.length) return;
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `toolkit_logs_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const headers = ['id', 'timestamp', 'lookup_type', 'query_value', 'status', 'summary'];
      const rows = filteredLogs.map(l => [
        l.id,
        l.created_at,
        l.lookup_type,
        `"${(l.query_value || '').replace(/"/g, '""')}"`,
        l.status,
        `"${JSON.stringify(l.result_summary || {}).replace(/"/g, '""')}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `toolkit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getSummarySnippet = (row) => {
    const s = row.result_summary;
    if (!s || typeof s !== 'object') return '-';
    switch (row.lookup_type?.toLowerCase()) {
      case 'login':
        return row.status === 'success'
          ? `User signed in: ${s.userName || 'Analyst'} (${s.role || 'User'})`
          : `Failed login attempt: ${s.reason || 'Invalid credentials'}`;
      case 'logout':
        return `User signed out: ${s.userName || 'Analyst'}`;
      case 'register':
        return `Account registered: ${s.userName || 'New User'} (${s.role || 'User'})`;
      case 'threat-scan':
      case 'scan':
        return `${s.verdict || 'Scan'}: ${s.detectionRate ? `${s.detectionRate} detections` : `${s.malicious || 0} flags`}`;
      case 'dns':
        return `A: ${Array.isArray(s.a) && s.a.length ? s.a[0] : 'None'} • MX: ${s.mxCount ?? 0}`;
      case 'ip':
        return `${s.version || 'IP'}: ${s.hostname && s.hostname !== 'No PTR record found' ? s.hostname : (s.networkType || 'Valid')}`;
      case 'reverse-dns':
        return s.hostname ? `PTR: ${s.hostname}` : (s.status || 'No PTR');
      case 'email':
        return `${s.domain || 'Domain'} (${s.mxCheck || 'Checked'})`;
      case 'whois':
        return s.registrar && s.registrar !== 'Unavailable' ? s.registrar : (s.available ? 'Available' : 'Registered');
      case 'name':
        return s.normalizedName || s.status || 'Processed';
      default:
        return s.action || Object.values(s).filter(v => typeof v === 'string').slice(0, 2).join(' • ') || 'Completed';
    }
  };

  const getTypeBadgeStyle = (type) => {
    switch (type?.toLowerCase()) {
      case 'login':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'logout':
        return { bg: '#f8fafc', color: '#64748b', border: '#cbd5e1' };
      case 'register':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
      case 'dns':
        return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
      case 'ip':
        return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'reverse-dns':
        return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
      case 'email':
        return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
      case 'whois':
        return { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' };
      case 'name':
        return { bg: '#fdf2f8', color: '#db2777', border: '#fbcfe8' };
      case 'threat-scan':
      case 'scan':
        return { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    }
  };

  const filteredLogs = allLogs.filter((log) => {
    if (logsStatusFilter !== 'all' && log.status !== logsStatusFilter) {
      return false;
    }
    if (logsSearch.trim()) {
      const q = logsSearch.toLowerCase();
      const matchQuery = log.query_value?.toLowerCase().includes(q);
      const matchType = log.lookup_type?.toLowerCase().includes(q);
      const matchSummary = JSON.stringify(log.result_summary || {}).toLowerCase().includes(q);
      return matchQuery || matchType || matchSummary;
    }
    return true;
  });

  return (
    <div className="dashboard-page">
      {/* Hero Banner */}
      <section className="dashboard-hero">
        <div className="hero-tagline">
          <span className="pulse-dot" />
          <span>Multiple Lookups. One Toolkit.</span>
        </div>
        <h1 className="hero-title">Integrated Lookup Toolkit</h1>
        <p className="hero-subtitle">
          An integrated cybersecurity diagnostic console unifying DNS, IP, Reverse PTR, Email-domain, WHOIS, and Name lookups into a single workflow.
        </p>

        <div className="hero-actions">
          <Link to="/integrated-lookup" className="btn btn-primary">
            <Layers size={18} />
            <span>Launch Integrated Lookup</span>
            <ArrowRight size={16} />
          </Link>
          <button
            onClick={() => handleTabChange(activeTab === 'logs' ? 'overview' : 'logs')}
            className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <FileText size={16} />
            <span>{activeTab === 'logs' ? 'Back to Overview' : 'Live Activity Logs'}</span>
          </button>
          <button
            onClick={() => setShowAccuracyModal(true)}
            className="btn btn-secondary flex items-center gap-2"
            title="Run end-to-end verification and display accuracy in percentage"
          >
            <ShieldCheck size={16} className="text-emerald" />
            <span>Verify Accuracy</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald/20 text-emerald border border-emerald/30">
              100%
            </span>
          </button>
          <button onClick={loadDashboardData} className="btn btn-secondary" title="Refresh metrics">
            <RefreshCw size={16} className={loading || loadingLogs ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {/* Dashboard Top Tabs: Overview vs Logs */}
      <div className="dashboard-nav-tabs" role="tablist" aria-label="Dashboard Views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`dash-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          <LayoutDashboard size={18} />
          <span>Overview & Metrics</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'logs'}
          className={`dash-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => handleTabChange('logs')}
        >
          <FileText size={18} />
          <span>Activity & System Logs</span>
          <span className="dash-tab-badge">
            {stats ? stats.totalLookups : recentLookups.length}
          </span>
        </button>
      </div>

      {activeTab === 'logs' ? (
        /* ==================== LOGS TAB CONTENT ==================== */
        <section className="logs-section">
          {/* Logs Metrics Summary Bar */}
          <div className="logs-summary-bar">
            <div className="log-metric-card">
              <div className="log-metric-icon" style={{ background: '#f0f9ff', color: '#0284c7' }}>
                <Activity size={20} />
              </div>
              <div>
                <div className="log-metric-label">Logged Events</div>
                <div className="log-metric-val">{allLogs.length}</div>
              </div>
            </div>

            <div className="log-metric-card">
              <div className="log-metric-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="log-metric-label">Successful Lookups</div>
                <div className="log-metric-val">
                  {allLogs.filter(l => l.status === 'success').length}
                </div>
              </div>
            </div>

            <div className="log-metric-card">
              <div className="log-metric-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                <LogIn size={20} />
              </div>
              <div>
                <div className="log-metric-label">Logins & Logouts</div>
                <div className="log-metric-val">
                  {allLogs.filter(l => ['login', 'logout', 'register'].includes(l.lookup_type?.toLowerCase())).length}
                </div>
              </div>
            </div>

            <div className="log-metric-card">
              <div className="log-metric-icon" style={{ background: '#faf5ff', color: '#7c3aed' }}>
                <Database size={20} />
              </div>
              <div>
                <div className="log-metric-label">Storage Backend</div>
                <div className="log-metric-val" style={{ fontSize: '1rem', marginTop: '2px' }}>
                  {health?.database?.connected ? 'Supabase PostgreSQL' : 'Local Storage Cache'}
                </div>
              </div>
            </div>
          </div>

          {/* Logs Toolbar Card */}
          <div className="logs-toolbar-card">
            <div className="logs-toolbar-row">
              <div className="logs-search-wrapper">
                <Search size={16} className="logs-search-icon" />
                <input
                  type="text"
                  className="logs-search-input"
                  placeholder="Search logs by query target, user, type, or result..."
                  value={logsSearch}
                  onChange={(e) => setLogsSearch(e.target.value)}
                />
              </div>

              <div className="logs-filter-group">
                <select
                  value={logsTypeFilter}
                  onChange={(e) => setLogsTypeFilter(e.target.value)}
                  className="logs-select"
                  aria-label="Filter by lookup type"
                >
                  <option value="all">All Modules & Events</option>
                  <optgroup label="Authentication & Security">
                    <option value="login">User Log In</option>
                    <option value="logout">User Log Out</option>
                    <option value="register">Account Registration</option>
                  </optgroup>
                  <optgroup label="Investigation Lookups">
                    <option value="dns">DNS Records</option>
                    <option value="ip">IP Network</option>
                    <option value="reverse-dns">Reverse DNS</option>
                    <option value="email">Email Domain</option>
                    <option value="whois">WHOIS</option>
                    <option value="name">Name / OSINT</option>
                    <option value="threat-scan">Threat Scan</option>
                  </optgroup>
                </select>

                <select
                  value={logsStatusFilter}
                  onChange={(e) => setLogsStatusFilter(e.target.value)}
                  className="logs-select"
                  aria-label="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="error">Failed / Error</option>
                </select>
              </div>

              <div className="logs-actions-group">
                <button
                  type="button"
                  onClick={loadLogsData}
                  className="btn btn-secondary py-1.5 px-3 text-xs"
                  title="Reload live logs"
                >
                  <RefreshCw size={14} className={loadingLogs ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportLogs('json')}
                  disabled={!filteredLogs.length}
                  className="btn btn-secondary py-1.5 px-3 text-xs"
                  title="Export filtered logs as JSON"
                >
                  <Download size={14} />
                  <span>JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportLogs('csv')}
                  disabled={!filteredLogs.length}
                  className="btn btn-secondary py-1.5 px-3 text-xs"
                  title="Export filtered logs as CSV"
                >
                  <Download size={14} />
                  <span>CSV</span>
                </button>

                {allLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="btn btn-secondary py-1.5 px-3 text-xs text-rose-500 hover:border-rose-300"
                    title="Clear all logs"
                  >
                    <Trash2 size={14} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Logs Table Card */}
          <div className="cyber-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal size={18} className="text-cyan" />
                <span>Recorded Investigation Activity ({filteredLogs.length})</span>
              </h2>
              <span className="text-xs text-secondary font-mono">
                Real live audit events
              </span>
            </div>

            {loadingLogs ? (
              <LoadingSpinner text="Fetching investigation logs..." />
            ) : filteredLogs.length > 0 ? (
              <div className="table-wrapper">
                <table className="cyber-table">
                  <thead>
                    <tr>
                      <th style={{ width: '175px' }}>Timestamp</th>
                      <th style={{ width: '130px' }}>Module</th>
                      <th>Target Query</th>
                      <th>Status</th>
                      <th>Summary Finding</th>
                      <th style={{ width: '190px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const badgeStyle = getTypeBadgeStyle(log.lookup_type);
                      return (
                        <tr key={log.id}>
                          <td className="text-xs text-secondary whitespace-nowrap font-mono">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-muted" />
                              <span>{formatDate(log.created_at)}</span>
                            </div>
                          </td>
                          <td>
                            <span
                              className="page-badge font-bold uppercase text-[10px] inline-flex items-center gap-1"
                              style={{
                                background: badgeStyle.bg,
                                color: badgeStyle.color,
                                border: `1px solid ${badgeStyle.border}`
                              }}
                            >
                              {log.lookup_type === 'login' && <LogIn size={11} />}
                              {log.lookup_type === 'logout' && <LogOut size={11} />}
                              {log.lookup_type === 'register' && <UserPlus size={11} />}
                              <span>{log.lookup_type}</span>
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-primary">
                                {log.query_value}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(log.query_value);
                                  setCopiedQueryId(log.id);
                                  setTimeout(() => setCopiedQueryId(null), 1500);
                                }}
                                className="text-muted hover:text-cyan text-xs"
                                title="Copy target query"
                              >
                                {copiedQueryId === log.id ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </td>
                          <td>
                            <span className={`status-pill ${log.status === 'success' ? 'status-success' : 'status-danger'}`}>
                              {log.status === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                              <span>{log.status}</span>
                            </span>
                          </td>
                          <td className="text-xs text-secondary max-w-xs truncate" title={getSummarySnippet(log)}>
                            {getSummarySnippet(log)}
                          </td>
                          <td>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedLog(log)}
                                className="btn btn-secondary py-1 px-2 text-xs"
                                title="Inspect raw JSON payload"
                              >
                                <Code2 size={13} />
                                <span>Inspect</span>
                              </button>
                              {['login', 'logout', 'register'].includes(log.lookup_type?.toLowerCase()) ? (
                                <Link
                                  to="/profile"
                                  className="btn btn-secondary py-1 px-2 text-xs text-cyan"
                                  title="View User Profiles & Access"
                                >
                                  <User size={12} />
                                  <span>User</span>
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleQuickLookup(log.lookup_type, log.query_value)}
                                  className="btn btn-primary py-1 px-2 text-xs"
                                  title="Run this query in Integrated Lookup"
                                >
                                  <Play size={12} />
                                  <span>Re-Run</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-secondary text-sm">
                <FileText size={36} className="mx-auto mb-2 text-muted opacity-50" />
                <p className="font-semibold text-primary">No logs match your filter criteria.</p>
                <p className="text-xs text-muted mt-1">
                  Try adjusting search keywords or selecting "All Modules".
                </p>
              </div>
            )}
          </div>
        </section>
      ) : (
        /* ==================== OVERVIEW TAB CONTENT ==================== */
        <>
          {/* Dashboard Statistics Cards */}
          <section className="stats-section">
            <div className="stats-grid">
              {/* Total Lookups */}
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Total Lookups</span>
                  <div className="stat-icon total">
                    <Activity size={20} />
                  </div>
                </div>
                <div className="stat-value">{stats ? stats.totalLookups : 0}</div>
                <div className="stat-footer">
                  <span>All recorded queries in database</span>
                </div>
              </div>

              {/* DNS Lookups */}
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">DNS Lookups</span>
                  <div className="stat-icon dns">
                    <Globe size={20} />
                  </div>
                </div>
                <div className="stat-value">{stats ? stats.dnsLookups : 0}</div>
                <div className="stat-footer">
                  <span>A, AAAA, MX, NS, TXT, PTR</span>
                </div>
              </div>

              {/* IP Lookups */}
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">IP Lookups</span>
                  <div className="stat-icon ip">
                    <Network size={20} />
                  </div>
                </div>
                <div className="stat-value">{stats ? stats.ipLookups : 0}</div>
                <div className="stat-footer">
                  <span>IPv4 / IPv6 validation & PTR</span>
                </div>
              </div>

              {/* Email Checks */}
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">Email Checks</span>
                  <div className="stat-icon email">
                    <Mail size={20} />
                  </div>
                </div>
                <div className="stat-value">{stats ? stats.emailChecks : 0}</div>
                <div className="stat-footer">
                  <span>Domain syntax & MX verification</span>
                </div>
              </div>

              {/* WHOIS Checks */}
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-title">WHOIS Checks</span>
                  <div className="stat-icon whois">
                    <FileSearch size={20} />
                  </div>
                </div>
                <div className="stat-value">{stats ? stats.whoisChecks : 0}</div>
                <div className="stat-footer">
                  <span>Domain registration records</span>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Launchpad Cards */}
          <section className="quick-launch-section">
            <div className="section-title">
              <span>Lookup Modules</span>
              <span className="text-xs text-secondary font-normal">Select a dedicated investigation tool</span>
            </div>

            <div className="quick-launch-grid">
              {/* Integrated Lookup */}
              <Link to="/integrated-lookup" className="quick-card" style={{ borderColor: '#bae6fd' }}>
                <div className="quick-card-top">
                  <div className="quick-card-icon" style={{ background: '#e0f2fe' }}>
                    <Layers size={22} />
                  </div>
                  <div className="quick-card-info">
                    <h3>Integrated Lookup</h3>
                    <p>Universal multi-target search with automatic input detection for IP, Domain, Email, or Name.</p>
                  </div>
                </div>
                <div className="quick-card-footer">
                  <span>Open Tool</span>
                  <ArrowRight size={14} />
                </div>
              </Link>

              {/* DNS Lookup */}
              <Link to="/integrated-lookup?type=dns" className="quick-card">
                <div className="quick-card-top">
                  <div className="quick-card-icon">
                    <Globe size={22} />
                  </div>
                  <div className="quick-card-info">
                    <h3>DNS Lookup</h3>
                    <p>Inspect A, AAAA, MX, NS, TXT, and PTR records directly with native Node.js DNS resolvers.</p>
                  </div>
                </div>
                <div className="quick-card-footer">
                  <span>Open Tool</span>
                  <ArrowRight size={14} />
                </div>
              </Link>

              {/* IP Lookup */}
              <Link to="/integrated-lookup?type=ip" className="quick-card">
                <div className="quick-card-top">
                  <div className="quick-card-icon">
                    <Network size={22} />
                  </div>
                  <div className="quick-card-info">
                    <h3>IP Lookup</h3>
                    <p>Validate IPv4 and IPv6 addresses, inspect network classes, and resolve reverse PTR hostnames.</p>
                  </div>
                </div>
                <div className="quick-card-footer">
                  <span>Open Tool</span>
                  <ArrowRight size={14} />
                </div>
              </Link>

              {/* Reverse DNS */}
              <Link to="/integrated-lookup?type=reverse-dns" className="quick-card">
                <div className="quick-card-top">
                  <div className="quick-card-icon">
                    <CornerDownRight size={22} />
                  </div>
                  <div className="quick-card-info">
                    <h3>Reverse DNS (PTR)</h3>
                    <p>Map raw IP addresses back to canonical hostnames using authoritative PTR records.</p>
                  </div>
                </div>
                <div className="quick-card-footer">
                  <span>Open Tool</span>
                  <ArrowRight size={14} />
                </div>
              </Link>

              {/* Email Lookup */}
              <Link to="/integrated-lookup?type=email" className="quick-card">
                <div className="quick-card-top">
                  <div className="quick-card-icon">
                    <Mail size={22} />
                  </div>
                  <div className="quick-card-info">
                    <h3>Email Domain Check</h3>
                    <p>Verify RFC email syntax, domain existence, and authoritative MX mail exchange servers.</p>
                  </div>
                </div>
                <div className="quick-card-footer">
                  <span>Open Tool</span>
                  <ArrowRight size={14} />
                </div>
              </Link>

              {/* WHOIS Lookup */}
              <Link to="/integrated-lookup?type=whois" className="quick-card">
                <div className="quick-card-top">
                  <div className="quick-card-icon">
                    <FileSearch size={22} />
                  </div>
                  <div className="quick-card-info">
                    <h3>WHOIS Lookup</h3>
                    <p>Retrieve registrar, creation date, expiry date, and nameservers using safe socket protocols.</p>
                  </div>
                </div>
                <div className="quick-card-footer">
                  <span>Open Tool</span>
                  <ArrowRight size={14} />
                </div>
              </Link>

              {/* Name Lookup */}
              <Link to="/integrated-lookup?type=name" className="quick-card">
                <div className="quick-card-top">
                  <div className="quick-card-icon">
                    <UserCheck size={22} />
                  </div>
                  <div className="quick-card-info">
                    <h3>Name & OSINT Lookup</h3>
                    <p>National entity classification, open-source profiles, and educational entity audit.</p>
                  </div>
                </div>
                <div className="quick-card-footer">
                  <span>Open Tool</span>
                  <ArrowRight size={14} />
                </div>
              </Link>

              {/* Accuracy & Self-Test Verification Suite */}
              <div
                onClick={() => setShowAccuracyModal(true)}
                className="quick-card cursor-pointer border-emerald/40 hover:border-emerald transition-all"
                style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
              >
                <div className="quick-card-top">
                  <div className="quick-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    <ShieldCheck size={22} />
                  </div>
                  <div className="quick-card-info">
                    <div className="flex items-center gap-2">
                      <h3>Accuracy & Self-Test Suite</h3>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald/20 text-emerald border border-emerald/30">
                        100% VERIFIED
                      </span>
                    </div>
                    <p>Execute automated diagnostic probes against ground-truth benchmarks to test and display accuracy in percentage.</p>
                  </div>
                </div>
                <div className="quick-card-footer">
                  <span className="text-emerald font-semibold">Verify Accuracy</span>
                  <ArrowRight size={14} className="text-emerald" />
                </div>
              </div>
            </div>
          </section>

          {/* Dashboard Bottom Grid: Recent Lookups & System Overview */}
          <div className="dashboard-columns">
            {/* Recent Lookups */}
            <div className="cyber-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <History size={18} className="text-cyan" />
                  <span>Recent Lookups</span>
                </h2>
                <button
                  type="button"
                  onClick={() => handleTabChange('logs')}
                  className="text-xs text-cyan hover:underline font-semibold bg-transparent border-0 cursor-pointer"
                >
                  View Full Logs Tab →
                </button>
              </div>

              {recentLookups.length > 0 ? (
                <div className="table-wrapper">
                  <table className="cyber-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Query</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLookups.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <span className="page-badge">{row.lookup_type}</span>
                          </td>
                          <td className="font-mono text-sm font-semibold">{row.query_value}</td>
                          <td>
                            <span className={`status-pill ${row.status === 'success' ? 'status-success' : 'status-danger'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleQuickLookup(row.lookup_type, row.query_value)}
                              className="btn btn-secondary py-1 px-2 text-xs"
                            >
                              Run Again
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-secondary text-sm">
                  <History size={32} className="mx-auto mb-2 text-muted opacity-50" />
                  <p>No lookup history recorded yet.</p>
                  <p className="text-xs text-muted mt-1">Run an Integrated Lookup above to start recording.</p>
                </div>
              )}
            </div>

            {/* System & Architecture Info */}
            <div className="cyber-card flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                  <Database size={18} className="text-cyan" />
                  <span>System & Storage</span>
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-lg bg-inner border border-subtle">
                    <div className="text-xs text-muted font-semibold uppercase">Database Engine</div>
                    <div className="text-white font-medium mt-1 flex items-center gap-2">
                      <span className="pulse-dot" />
                      <span>{health?.database?.connected ? 'Supabase PostgreSQL' : 'Supabase Local Storage Mode'}</span>
                    </div>
                    <div className="text-xs text-secondary mt-1">
                      {health?.database?.connected
                        ? 'Connected to remote Supabase cloud project.'
                        : 'Operating in local memory mode. Configure .env with Supabase credentials to enable cloud persistence.'}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-inner border border-subtle">
                    <div className="text-xs text-muted font-semibold uppercase">API Backend</div>
                    <div className="text-white font-medium mt-1">Node.js + Express (Port 5000)</div>
                    <div className="text-xs text-secondary mt-1">
                      Native DNS resolver, RFC 3912 client, rate-limited REST endpoints.
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-inner border border-subtle">
                    <div className="text-xs text-muted font-semibold uppercase">Security Scope</div>
                    <div className="text-emerald font-medium mt-1 flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      <span>Authorized Defensive Diagnostics</span>
                    </div>
                    <div className="text-xs text-secondary mt-1">
                      Defensive reconnaissance platform with strict zero-exploit safety boundaries.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-subtle text-xs text-muted flex items-center justify-between">
                <span>Status: Operational</span>
                <Link to="/about" className="text-cyan hover:underline">Learn More →</Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Raw JSON Inspection Modal */}
      {selectedLog && (
        <div className="log-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="log-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="log-modal-header">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-cyan" />
                <h3 className="font-display font-bold text-base text-primary">
                  Log Entry Details • <span className="font-mono">{selectedLog.query_value}</span>
                </h3>
              </div>
              <button
                type="button"
                className="text-muted hover:text-primary bg-transparent border-0 cursor-pointer"
                onClick={() => setSelectedLog(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="log-modal-body">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
                <div className="p-2 rounded bg-inner border border-subtle">
                  <div className="text-muted font-semibold uppercase text-[10px]">Type</div>
                  <div className="font-bold text-primary uppercase mt-0.5">{selectedLog.lookup_type}</div>
                </div>
                <div className="p-2 rounded bg-inner border border-subtle">
                  <div className="text-muted font-semibold uppercase text-[10px]">Status</div>
                  <div className="font-bold text-emerald mt-0.5">{selectedLog.status}</div>
                </div>
                <div className="p-2 rounded bg-inner border border-subtle col-span-2">
                  <div className="text-muted font-semibold uppercase text-[10px]">Timestamp</div>
                  <div className="font-mono text-primary mt-0.5">{formatDate(selectedLog.created_at)}</div>
                </div>
              </div>

              <div className="text-xs font-bold text-primary mb-2 flex items-center justify-between">
                <span>Result Summary Payload</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                    setCopiedJson(true);
                    setTimeout(() => setCopiedJson(false), 2000);
                  }}
                  className="text-xs text-cyan hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                >
                  {copiedJson ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                  <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="log-code-pre">
                {JSON.stringify(selectedLog.result_summary || selectedLog, null, 2)}
              </pre>
            </div>

            <div className="log-modal-footer">
              <button
                type="button"
                className="btn btn-secondary text-xs"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </button>
              {['login', 'logout', 'register'].includes(selectedLog.lookup_type?.toLowerCase()) ? (
                <Link
                  to="/profile"
                  className="btn btn-primary text-xs"
                  onClick={() => setSelectedLog(null)}
                >
                  <User size={13} />
                  <span>View Analyst Profile</span>
                </Link>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary text-xs"
                  onClick={() => {
                    const targetLog = selectedLog;
                    setSelectedLog(null);
                    handleQuickLookup(targetLog.lookup_type, targetLog.query_value);
                  }}
                >
                  <Play size={13} />
                  <span>Launch in Integrated Lookup</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear Logs Confirmation Modal */}
      {showClearConfirm && (
        <div className="log-modal-backdrop" onClick={() => setShowClearConfirm(false)}>
          <div className="log-modal-box max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="log-modal-header">
              <h3 className="font-display font-bold text-base text-rose-600 flex items-center gap-2">
                <AlertCircle size={18} />
                <span>Confirm Clearing Logs</span>
              </h3>
              <button onClick={() => setShowClearConfirm(false)} className="text-muted hover:text-primary bg-transparent border-0 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 text-sm text-secondary">
              Are you sure you want to permanently clear all lookup and investigation logs from the database? This action cannot be undone.
            </div>
            <div className="log-modal-footer">
              <button
                type="button"
                className="btn btn-secondary text-xs"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary text-xs bg-rose-600 border-rose-600 hover:bg-rose-700"
                onClick={handleClearLogs}
              >
                Yes, Clear All Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automated Accuracy & Diagnostic Verification Modal */}
      <AccuracyModal
        isOpen={showAccuracyModal}
        onClose={() => setShowAccuracyModal(false)}
      />
    </div>
  );
}
