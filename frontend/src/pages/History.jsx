import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Play,
  Database,
  Calendar,
  X,
  Layers
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

export default function History() {
  const { isAdmin } = useAuth();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [storageSource, setStorageSource] = useState('local_cache');

  // Confirmation modal state for clearing all
  const [showClearModal, setShowClearModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getHistory({
        search: searchTerm.trim(),
        type: selectedType === 'all' ? '' : selectedType,
        limit: 100
      });
      setHistoryList(res.data || []);
      setStorageSource(res.source || 'local_cache');
    } catch (err) {
      setError(err.message || 'Failed to load lookup history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchHistory();
    }
  }, [isAdmin, selectedType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDeleteItem = async (id) => {
    try {
      setDeletingId(id);
      await api.deleteHistoryItem(id);
      setHistoryList(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    try {
      setShowClearModal(false);
      setLoading(true);
      await api.clearAllHistory();
      setHistoryList([]);
    } catch (err) {
      setError(err.message || 'Failed to clear history.');
    } finally {
      setLoading(false);
    }
  };

  const handleReRun = (type, query) => {
    navigate('/integrated-lookup', {
      state: { initialQuery: query, initialType: (type === 'threat-scan' || type === 'scan') ? 'auto' : type }
    });
  };

  // Format date helper with time: "16 Sep 2026, 17:36:12"
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

  // Extract human-readable summary snippet
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
        return s.registrar && s.registrar !== 'Unavailable' ? s.registrar : (s.isAvailable ? 'Registered' : 'Unavailable');
      case 'name':
        return s.normalizedName || s.status || 'Processed';
      default:
        return s.action || Object.values(s).filter(v => typeof v === 'string').slice(0, 2).join(' • ') || 'Completed';
    }
  };

  if (!isAdmin) {
    return (
      <div className="history-page flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="cyber-card max-w-lg p-8 border-rose-500/40 text-center mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Administrator Access Required</h2>
          <p className="text-secondary text-sm mb-6 leading-relaxed">
            Investigation lookup history, forensics, and audit log details are strictly restricted to Administrator accounts.
          </p>
          <Link to="/integrated-lookup" className="btn btn-primary inline-flex items-center gap-2">
            <Layers size={16} />
            <span>Go to Integrated Lookup</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <section className="lookup-hero mb-6">
        <div className="lookup-hero-header flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="page-badge mb-2">Audit & Forensics</div>
            <h2>
              <HistoryIcon className="text-cyan" size={28} />
              <span>Lookup History</span>
            </h2>
            <p>Review logged investigation queries, inspect results summary, and manage database records.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="status-pill status-info"
              title={
                storageSource === 'supabase' || storageSource === 'postgresql'
                  ? 'Data stored in Supabase PostgreSQL cloud table'
                  : 'Data stored in local in-memory cache'
              }
            >
              <Database size={13} />
              <span>Storage: {storageSource === 'supabase' || storageSource === 'postgresql' ? 'Supabase PostgreSQL' : 'Local Cache'}</span>
            </div>

            {historyList.length > 0 && (
              <button
                className="btn btn-danger text-xs"
                onClick={() => setShowClearModal(true)}
              >
                <Trash2 size={14} />
                <span>Clear History</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <form className="history-filter-form" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper flex-1 min-w-[220px]">
            <Search className="search-icon-inside" size={18} />
            <input
              type="text"
              className="search-input-large text-sm py-2"
              placeholder="Search history by query value (e.g. google.com, 8.8.8.8)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="search-select-wrapper">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-sm"
              aria-label="Filter by type"
            >
              <option value="all">All Types</option>
              <optgroup label="Authentication & Access">
                <option value="login">User Log In</option>
                <option value="logout">User Log Out</option>
                <option value="register">Registration</option>
              </optgroup>
              <optgroup label="Investigation Modules">
                <option value="threat-scan">Threat Scan (VirusTotal)</option>
                <option value="dns">DNS</option>
                <option value="ip">IP</option>
                <option value="reverse-dns">Reverse DNS</option>
                <option value="email">Email</option>
                <option value="whois">WHOIS</option>
                <option value="name">Name</option>
              </optgroup>
            </select>
          </div>

          <div className="history-search-actions">
            <button type="submit" className="btn btn-primary text-sm">
              <Search size={16} />
              <span>Search</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary text-sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                fetchHistory();
              }}
              title="Reset filters"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </form>
      </section>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      {loading ? (
        <LoadingSpinner text="Retrieving records from database..." />
      ) : historyList.length > 0 ? (
        <div className="cyber-card">
          <div className="table-wrapper">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Target Query</th>
                  <th>Key Finding / Summary</th>
                  <th>Status</th>
                  <th>Recorded Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="page-badge uppercase text-xs">{row.lookup_type}</span>
                    </td>
                    <td className="font-mono text-sm font-bold text-white break-all">
                      {row.query_value}
                    </td>
                    <td className="text-secondary text-xs font-mono max-w-[220px] truncate" title={JSON.stringify(row.result_summary || {})}>
                      {getSummarySnippet(row)}
                    </td>
                    <td>
                      <span className={`status-pill ${row.status === 'success' ? 'status-success' : 'status-danger'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="text-secondary text-xs font-mono whitespace-nowrap">
                      {formatDate(row.created_at)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-secondary py-1 px-2 text-xs"
                          onClick={() => handleReRun(row.lookup_type, row.query_value)}
                          title="Re-run this lookup"
                        >
                          <Play size={12} />
                          <span>Run</span>
                        </button>
                        <button
                          className="btn btn-danger py-1 px-2 text-xs"
                          onClick={() => handleDeleteItem(row.id)}
                          disabled={deletingId === row.id}
                          title="Delete this record"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="cyber-card text-center py-12">
          <HistoryIcon size={40} className="mx-auto mb-3 text-muted opacity-40" />
          <h3 className="text-lg font-bold text-white">
            {searchTerm || selectedType !== 'all' ? 'No Matching Records Found' : 'No lookup history yet.'}
          </h3>
          <p className="text-secondary text-sm mt-1 max-w-md mx-auto">
            {searchTerm || selectedType !== 'all'
              ? 'No historical lookups match your search filters. Try clearing the search query or changing the filter type.'
              : 'Perform your first query in Integrated Lookup to record investigation history.'}
          </p>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearModal && (
        <div className="modal-backdrop" onClick={() => setShowClearModal(false)}>
          <div className="modal-box danger-modal cyber-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between pb-3 border-b border-subtle">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertTriangle size={20} />
                <span>Confirm Clear History</span>
              </div>
              <button className="btn-icon" onClick={() => setShowClearModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body py-4 text-sm text-secondary">
              Are you sure you want to delete all lookup history records? This action cannot be undone.
            </div>
            <div className="modal-footer flex items-center justify-end gap-2 pt-3 border-t border-subtle">
              <button className="btn btn-secondary text-xs" onClick={() => setShowClearModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger text-xs" onClick={handleClearAll}>
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
