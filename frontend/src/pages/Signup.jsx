import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Check,
  AlertCircle,
  Briefcase,
  Building,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ErrorAlert from '../components/ErrorAlert';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('SOC Analyst');
  const [organization, setOrganization] = useState('');
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedPolicy, setAgreedPolicy] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Automatically redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Password strength calculation
  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-700' };
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score += 1;

    if (score <= 2) return { score, label: 'Weak', color: '#f43f5e' };
    if (score === 3) return { score, label: 'Moderate', color: '#f59e0b' };
    if (score === 4) return { score, label: 'Strong', color: '#06b6d4' };
    return { score, label: 'Elite Security', color: '#10b981' };
  };

  const strength = calculateStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    if (role === 'Administrator' && !adminSecretKey.trim()) {
      setError('Please enter the Admin Authorization Passkey to register as an Administrator.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirmation password.');
      return;
    }
    if (!agreedPolicy) {
      setError('You must agree to the Defensive Reconnaissance Policy to continue.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        organization: organization.trim() || (role === 'Administrator' ? 'Cyber Defense Operations' : 'Independent'),
        adminSecretKey: role === 'Administrator' ? adminSecretKey.trim() : undefined
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card cyber-card max-w-[480px]">
        {/* Header */}
        <div className="auth-header text-center">
          <div className="auth-logo-badge">
            <ShieldCheck size={28} className="text-cyan" />
          </div>
          <h2 className="auth-title">Create Analyst Account</h2>
          <p className="auth-subtitle">
            Join the educational cybersecurity investigation platform. Get personalized history and automated API keys.
          </p>
        </div>

        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {/* Registration Form */}
        <form className="auth-form mt-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="name-input">Full Name</label>
            <div className="input-with-icon">
              <User className="input-icon" size={18} />
              <input
                id="name-input"
                type="text"
                className="form-input"
                placeholder="e.g. Alex Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="email-reg-input">Work or Educational Email</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input
                id="email-reg-input"
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

          {/* Role & Organization Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label" htmlFor="role-select">Primary Role</label>
              <div className="search-select-wrapper w-full">
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs"
                >
                  <option value="SOC Analyst">SOC Analyst</option>
                  <option value="Security Researcher">Security Researcher</option>
                  <option value="Network Engineer">Network Engineer</option>
                  <option value="Incident Responder">Incident Responder</option>
                  <option value="Cyber Security Student">Student / Trainee</option>
                  <option value="Administrator">Administrator (SOC Admin)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="org-input">Organization / Team</label>
              <div className="input-with-icon">
                <Building className="input-icon" size={16} />
                <input
                  id="org-input"
                  type="text"
                  className="form-input text-xs"
                  placeholder="e.g. SecOps Lab"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Admin Authorization Passkey (Conditioned on Administrator role) */}
          {role === 'Administrator' && (
            <div className="form-group animate-fade-in p-3 rounded-lg bg-amber-950/20 border border-amber-500/40">
              <label className="form-label text-amber-400 flex items-center justify-between" htmlFor="admin-key-input">
                <span className="flex items-center gap-1.5">
                  <KeyRound size={14} />
                  <span>Admin Authorization Passkey</span>
                </span>
                <span className="text-[10px] text-amber-400/80 font-normal">Required for SOC Admin</span>
              </label>
              <div className="input-with-icon mt-1">
                <Lock className="input-icon text-amber-400" size={18} />
                <input
                  id="admin-key-input"
                  type="password"
                  className="form-input border-amber-500/50 focus:border-amber-400 font-mono"
                  placeholder="Enter administrator passkey"
                  value={adminSecretKey}
                  onChange={(e) => setAdminSecretKey(e.target.value)}
                  required
                />
              </div>
              <p className="text-[11px] text-secondary mt-1.5">
                Administrative roles grant privileges to inspect system telemetry, view registered accounts, and manage database synchronization.
              </p>
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password-reg-input">Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                id="password-reg-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Create a strong password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="input-action-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password strength meter */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-secondary">Password Security:</span>
                  <span className="font-semibold" style={{ color: strength.color }}>{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className="h-full flex-1 rounded-full transition-all duration-300"
                      style={{
                        background: level <= strength.score ? strength.color : 'transparent'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirm-pass-input">Confirm Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                id="confirm-pass-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Confirm your password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <span className="text-xs text-rose-400 mt-1 block">Passwords do not match.</span>
            )}
          </div>

          {/* Defensive Policy Agreement */}
          <div className="flex items-start gap-2.5 mt-4">
            <input
              id="policy-checkbox"
              type="checkbox"
              checked={agreedPolicy}
              onChange={(e) => setAgreedPolicy(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan focus:ring-cyan"
            />
            <label htmlFor="policy-checkbox" className="text-xs text-secondary leading-relaxed cursor-pointer">
              I agree to the <strong className="text-white">Defensive Reconnaissance Policy</strong> and confirm that all lookups will be conducted strictly for authorized diagnostic, administrative, or educational security research.
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`btn ${role === 'Administrator' ? 'btn-danger' : 'btn-primary'} w-full mt-6 py-2.5 font-bold flex items-center justify-center gap-2`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span>
                <span>Registering Account...</span>
              </>
            ) : (
              <>
                <span>{role === 'Administrator' ? 'Register as Administrator' : 'Create Account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer text-center mt-6 pt-4 border-t border-subtle">
          <p className="text-xs text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan font-bold hover:underline">
              Sign In here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
