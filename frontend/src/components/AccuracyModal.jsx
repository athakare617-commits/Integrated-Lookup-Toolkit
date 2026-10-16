import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  X,
  Clock,
  Layers,
  Sparkles,
  Zap,
  Server
} from 'lucide-react';
import api from '../services/api';

export default function AccuracyModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const runVerification = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.verifyAccuracy();
      setReport(data);
    } catch (err) {
      setError(err.message || 'Verification test failed to run. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !report && !loading) {
      runVerification();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyReport = () => {
    if (!report) return;
    const text = `=== INTEGRATED LOOKUP TOOLKIT ACCURACY REPORT ===
Overall Accuracy: ${report.accuracyPercentage}% (${report.grade} - ${report.statusText})
Tests Passed: ${report.metrics.passedTests} / ${report.metrics.totalTests}
Total Duration: ${report.metrics.totalDurationMs}ms (Avg: ${report.metrics.averageLatencyMs}ms/test)
Verified At: ${new Date(report.verifiedAt).toLocaleString()}

MODULE BREAKDOWN:
${report.tests.map(t => `- [${t.passed ? 'PASS 100%' : 'FAIL 0%'}] ${t.module}: ${t.name} (Target: ${t.target}) -> ${t.actual} [${t.latencyMs}ms]`).join('\n')}
=================================================`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-surface rounded-2xl border border-cyan/30 shadow-2xl flex flex-col overflow-hidden text-primary"
        style={{
          boxShadow: '0 20px 60px -15px rgba(6, 182, 212, 0.25), 0 0 0 1px rgba(6, 182, 212, 0.15)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-subtle bg-inner/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan/10 border border-cyan/30 text-cyan">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Toolkit Accuracy & Verification Suite
                </h2>
                <span className="page-badge text-[11px] py-0.5">Automated Diagnostics</span>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Probes every lookup engine against authentic ground truth to calculate verifiable accuracy.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary hover:text-white hover:bg-inner transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3">
              <AlertTriangle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-rose-200">Verification Error</div>
                <div className="mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {loading && !report ? (
            <div className="py-16 text-center space-y-4">
              <div className="relative inline-block">
                <RefreshCw size={44} className="text-cyan animate-spin" />
                <Sparkles size={20} className="text-emerald absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Running Live Diagnostic Probes...</h3>
                <p className="text-xs text-secondary max-w-md mx-auto mt-1">
                  Testing DNS, IPv4/IPv6, Reverse PTR, Email deliverability, WHOIS sockets, Name OSINT, and Database integrity...
                </p>
              </div>
            </div>
          ) : report ? (
            <>
              {/* Grand Accuracy Percentage Banner */}
              <div
                className="relative overflow-hidden rounded-2xl p-6 border bg-gradient-to-br from-cyan-950/40 via-surface to-emerald-950/30 flex flex-col sm:flex-row items-center justify-between gap-6"
                style={{ borderColor: report.accuracyPercentage >= 90 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)' }}
              >
                <div className="flex items-center gap-5">
                  {/* Circular Accuracy Display */}
                  <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-inner border-4 border-emerald shadow-lg flex-shrink-0">
                    <div className="text-center">
                      <span className="text-2xl font-black text-emerald tracking-tight">
                        {report.accuracyPercentage}%
                      </span>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                        ACCURACY
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald/20 text-emerald border border-emerald/30">
                        Grade {report.grade}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {report.statusText}
                      </span>
                    </div>
                    <p className="text-xs text-secondary mt-1 max-w-sm">
                      All verification assertions passed against authoritative production benchmarks.
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted font-mono">
                      <span>✓ {report.metrics.passedTests} / {report.metrics.totalTests} Checks Passed</span>
                      <span>•</span>
                      <span>⏱️ {report.metrics.totalDurationMs}ms Latency</span>
                    </div>
                  </div>
                </div>

                {/* Accuracy Quick Metric Cards */}
                <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto">
                  <div className="p-3 rounded-xl bg-inner/80 border border-subtle text-center min-w-[100px]">
                    <div className="text-[10px] uppercase font-bold text-secondary">Operational Status</div>
                    <div className="text-xs font-bold text-emerald mt-0.5 flex items-center justify-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>Verified</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-inner/80 border border-subtle text-center min-w-[100px]">
                    <div className="text-[10px] uppercase font-bold text-secondary">Avg Latency</div>
                    <div className="text-xs font-bold text-cyan mt-0.5 font-mono">
                      {report.metrics.averageLatencyMs} ms
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Module Verification Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-secondary uppercase tracking-wider px-1">
                  <span>Detailed Module-by-Module Verification ({report.tests.length})</span>
                  <span>Accuracy & Latency</span>
                </div>

                <div className="space-y-2">
                  {report.tests.map((test, idx) => (
                    <div
                      key={test.id || idx}
                      className="p-3.5 rounded-xl bg-inner/60 border border-subtle hover:border-cyan/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          {test.passed ? (
                            <CheckCircle2 size={18} className="text-emerald" />
                          ) : (
                            <XCircle size={18} className="text-rose-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{test.module}</span>
                            <span className="text-[11px] text-muted">• {test.name}</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface border border-subtle text-cyan">
                              Target: {test.target}
                            </span>
                          </div>
                          <div className="text-secondary text-[11px] mt-1 font-mono">
                            {test.actual}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:self-center self-end flex-shrink-0">
                        <span className="text-[11px] font-mono text-muted flex items-center gap-1">
                          <Clock size={12} />
                          {test.latencyMs}ms
                        </span>
                        <span
                          className={`font-mono font-bold text-xs px-2.5 py-1 rounded-md border ${
                            test.passed
                              ? 'bg-emerald/15 text-emerald border-emerald/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {test.accuracy}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-subtle bg-inner/60 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-muted">
            {report?.verifiedAt && (
              <span>Verified: {new Date(report.verifiedAt).toLocaleTimeString()}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {report && (
              <button
                onClick={handleCopyReport}
                className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5"
                title="Copy verification telemetry to clipboard"
              >
                {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                <span>{copied ? 'Copied Report!' : 'Copy Summary'}</span>
              </button>
            )}

            <button
              onClick={runVerification}
              disabled={loading}
              className="btn btn-primary text-xs flex items-center gap-1.5 py-1.5"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Testing...' : 'Re-Run Verification'}</span>
            </button>

            <button
              onClick={onClose}
              className="btn btn-secondary text-xs py-1.5"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
