// API Base URL from environment or fallback to relative for Vite proxy
const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

let activeToken = typeof window !== 'undefined' ? localStorage.getItem('iltk_auth_token') : null;

/**
 * Generic API request handler with error wrapping and timeout
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const token = activeToken || (typeof window !== 'undefined' ? localStorage.getItem('iltk_auth_token') : null);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.error || `Request failed with status ${response.status}`);
    }

    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Lookup request timed out. Please try again.');
    }
    throw new Error(err.message || 'Unable to connect to the lookup service.');
  }
}

export const api = {
  // Token setter
  setAuthToken: (token) => {
    activeToken = token;
  },

  // Health, Stats & Accuracy Verification
  getHealth: () => request('/health'),
  getStats: () => request('/stats'),
  verifyAccuracy: () => request('/accuracy/verify'),

  // Authentication & SOC Profiles
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  logout: (userData = {}) =>
    request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  getMe: () => request('/auth/me'),

  getAllUsers: () => request('/auth/users'),

  regenerateApiKey: () =>
    request('/auth/api-key', {
      method: 'POST'
    }),

  resetPassword: (email, newPassword, adminSecretKey) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword, adminSecretKey })
    }),

  // History
  getHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/history${query ? `?${query}` : ''}`);
  },
  deleteHistoryItem: (id) => request(`/history/${id}`, { method: 'DELETE' }),
  clearAllHistory: () => request('/history', { method: 'DELETE' }),

  // Lookups
  runIntegratedLookup: (query, type = 'auto') =>
    request('/integrated-lookup', {
      method: 'POST',
      body: JSON.stringify({ query, type })
    }),

  runDnsLookup: (domain) =>
    request(`/dns?domain=${encodeURIComponent(domain)}`),

  runIpLookup: (ip) =>
    request(`/ip?ip=${encodeURIComponent(ip)}`),

  runReverseDnsLookup: (ip) =>
    request(`/reverse-dns?ip=${encodeURIComponent(ip)}`),

  runEmailLookup: (email) =>
    request(`/email?email=${encodeURIComponent(email)}`),

  runWhoisLookup: (domain) =>
    request(`/whois?domain=${encodeURIComponent(domain)}`),

  runNameLookup: (name) =>
    request(`/name?name=${encodeURIComponent(name)}`),

  // VirusTotal Cyber Threat & Malware Scanner
  runThreatScan: (query, type = 'auto') =>
    request('/scan', {
      method: 'POST',
      body: JSON.stringify({ query, type })
    }),

  scanDomain: (domain) =>
    request(`/scan/domain?domain=${encodeURIComponent(domain)}`),

  scanIp: (ip) =>
    request(`/scan/ip?ip=${encodeURIComponent(ip)}`),

  scanUrl: (url, force = false) =>
    request(`/scan/url?url=${encodeURIComponent(url)}${force ? '&force=true' : ''}`),

  scanHash: (hash) =>
    request(`/scan/hash?hash=${encodeURIComponent(hash)}`),

  getScanStatus: () =>
    request('/scan/status')
};

export default api;
