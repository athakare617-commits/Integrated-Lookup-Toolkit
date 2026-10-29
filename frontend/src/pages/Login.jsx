import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  KeyRound,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ErrorAlert from '../components/ErrorAlert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPasskey, setResetPasskey] = useState('ADMIN2026');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { login, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectDestination = (isAdminUser) => {
    const from = location.state?.from;
    if (from && (from.startsWith('/dashboard') || from.startsWith('/logs') || from.startsWith('/history'))) {
      return isAdminUser ? from : '/integrated-lookup';
    }
    if (from) return from;
    return isAdminUser ? '/dashboard' : '/integrated-lookup';
  };

  // Automatically redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(getRedirectDestination(isAdmin), { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, isAdmin]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showForgotModal) {
        setShowForgotModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForgotModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await login(email.trim(), password);
      const isUserAdmin = res?.user?.role === 'Administrator' || res?.user?.role?.toLowerCase() === 'admin';
      navigate(getRedirectDestination(isUserAdmin), { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError(null);

    if (!resetEmail.trim()) {
      setResetError('Please enter your registered email address.');
      return;
    }
    if (!resetPasskey.trim()) {
      setResetError('Please enter the Admin Authorization Passkey (default: ADMIN2026).');
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }

    try {
      setResetLoading(true);
      await api.resetPassword(resetEmail.trim(), resetNewPassword, resetPasskey.trim());
      setResetSuccess(true);
      setEmail(resetEmail.trim());
      setPassword(resetNewPassword);
    } catch (err) {
      setResetError(err.message || 'Password reset failed. Please verify your email and passkey.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card cyber-card">
        {/* Header */}
        <div className="auth-header text-center">
          <div className="auth-logo-badge">
            <Shield size={28} className="text-cyan" />
          </div>
          <h2 className="auth-title">Analyst Authentication</h2>
          <p className="auth-subtitle">
            Sign in with your registered analyst credentials to access the Integrated Lookup Toolkit.
          </p>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {/* Form */}
        <form className="auth-form mt-4" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              Email Address
            </label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input
                id="email-input"
                type="email"
                className="form-input"
                placeholder="analyst@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="flex items-center justify-between">
              <label className="form-label" htmlFor="password-input">Password</label>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => setShowForgotModal(true)}
              >
                Forgot password?
              </button>
            </div>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between my-3">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-xs text-secondary">Remember my session</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-2.5 font-bold"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Toolkit</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Signup */}
        <div className="auth-card-footer text-center mt-6 pt-4 border-t border-subtle">
          <p className="text-xs text-secondary">
            Don't have an analyst account yet?{' '}
            <Link to="/signup" className="text-cyan font-bold hover:underline">
              Create new account
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div
            className="modal-box forgot-password-modal cyber-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
          >
            <div className="modal-header flex items-center justify-between pb-3.5 border-b border-subtle">
              <div className="flex items-center gap-2.5 text-cyan font-bold">
                <div className="modal-icon-badge">
                  <KeyRound size={18} />
                </div>
                <span id="forgot-password-title" className="text-white text-base">Password Recovery</span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowForgotModal(false)}
                aria-label="Close recovery dialog"
              >
                <X size={16} />
              </button>
            </div>

            {resetSuccess ? (
              <div className="py-5 text-center">
                <div className="reset-success-icon-wrap mb-3 inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 size={36} className="text-emerald" />
                </div>
                <h4 className="text-sm font-bold text-white mt-1">Password Reset Successful!</h4>
                <p className="text-xs text-secondary mt-2 leading-relaxed">
                  Your credentials have been updated. You can now sign in with your new password.
                </p>
                <div className="mt-5">
                  <button
                    type="button"
                    className="btn btn-primary text-xs px-5 py-2 font-bold w-full"
                    onClick={() => {
                      setShowForgotModal(false);
                      setResetSuccess(false);
                    }}
                  >
                    Proceed to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="pt-3 pb-1">
                <p className="text-xs text-secondary mb-3 leading-relaxed">
                  Provide your registered email and the <strong className="text-amber-400">Admin Authorization Passkey</strong> to reset your password.
                </p>

                {resetError && (
                  <div className="mb-3.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="form-group mb-3">
                  <label className="form-label text-xs" htmlFor="reset-email-input">
                    <span>Registered Email</span>
                    <span className="text-muted text-[11px]">(Required)</span>
                  </label>
                  <div className="input-with-icon">
                    <Mail className="input-icon" size={16} />
                    <input
                      id="reset-email-input"
                      type="email"
                      className="form-input text-xs"
                      placeholder="admin@domain.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <div className="flex items-center justify-between">
                    <label className="form-label text-xs text-amber-400" htmlFor="reset-passkey-input">
                      <span>Admin Security Passkey</span>
                    </label>
                    <span className="text-[10px] text-amber-400/90 font-mono bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                      Default: ADMIN2026
                    </span>
                  </div>
                  <div className="input-with-icon">
                    <Shield className="input-icon text-amber-400" size={16} />
                    <input
                      id="reset-passkey-input"
                      type="text"
                      className="form-input text-xs font-mono"
                      placeholder="ADMIN2026"
                      value={resetPasskey}
                      onChange={(e) => setResetPasskey(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group mb-4">
                  <label className="form-label text-xs" htmlFor="reset-new-password">
                    <span>New Password</span>
                    <span className="text-muted text-[11px]">(Min 6 characters)</span>
                  </label>
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={16} />
                    <input
                      id="reset-new-password"
                      type={showResetPassword ? 'text' : 'password'}
                      className="form-input text-xs"
                      placeholder="Enter new strong password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="input-action-btn"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showResetPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-subtle">
                  <button
                    type="button"
                    className="btn btn-secondary text-xs px-3.5 py-2"
                    onClick={() => {
                      setShowForgotModal(false);
                      setResetError(null);
                    }}
                    disabled={resetLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary text-xs px-4 py-2 font-bold flex items-center gap-2"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <span className="animate-spin text-xs">⟳</span>
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
