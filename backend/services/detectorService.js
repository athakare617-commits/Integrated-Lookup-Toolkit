import validator from 'validator';

/**
 * Automatically detect input type based on string patterns
 */
export function detectInputType(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return { type: null, label: 'Unknown', error: 'Input is empty.' };
  }

  const input = rawInput.trim();

  // 1. File Hash Check (MD5: 32, SHA-1: 40, SHA-256: 64 hex characters)
  if (/^[a-fA-F0-9]{32}$/.test(input)) {
    return { type: 'threat-scan', label: 'File Hash (MD5)', confidence: 'high' };
  }
  if (/^[a-fA-F0-9]{40}$/.test(input)) {
    return { type: 'threat-scan', label: 'File Hash (SHA-1)', confidence: 'high' };
  }
  if (/^[a-fA-F0-9]{64}$/.test(input)) {
    return { type: 'threat-scan', label: 'File Hash (SHA-256)', confidence: 'high' };
  }

  // 2. URL Check (explicit http/https or path)
  if (/^https?:\/\//i.test(input)) {
    return { type: 'threat-scan', label: 'URL (Security Scan)', confidence: 'high' };
  }

  // 3. Email check: contains '@' and valid email format or email structure
  if (input.includes('@')) {
    if (validator.isEmail(input)) {
      return { type: 'email', label: 'Email', confidence: 'high' };
    }
    // Partial email structure
    const parts = input.split('@');
    if (parts.length === 2 && parts[0].length > 0 && parts[1].includes('.')) {
      return { type: 'email', label: 'Email', confidence: 'medium' };
    }
  }

  // 2. IPv4 / IPv6 check
  if (validator.isIP(input, 4)) {
    return { type: 'ip', label: 'IP Address (IPv4)', ipVersion: 'IPv4', confidence: 'high' };
  }
  if (validator.isIP(input, 6)) {
    return { type: 'ip', label: 'IPv6 Address', ipVersion: 'IPv6', confidence: 'high' };
  }

  // 3. Domain / FQDN check
  // Clean off protocol and paths if provided
  const cleanedDomain = input
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .split('/')[0]
    .split(':')[0];

  if (
    validator.isFQDN(cleanedDomain, { require_tld: true }) ||
    /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(cleanedDomain)
  ) {
    return { type: 'dns', label: 'Domain', cleanedInput: cleanedDomain, confidence: 'high' };
  }

  // 4. Name check: letters, spaces, hyphens, no dots or @
  // Typically 2+ words or alphabet string
  if (/^[a-zA-Z\s.'\-]{2,60}$/.test(input) && !input.includes('://') && !input.includes('/')) {
    return { type: 'name', label: 'Name', confidence: 'medium' };
  }

  return {
    type: null,
    label: 'Unknown',
    error: 'Unable to determine input type. Please select a lookup type manually.'
  };
}
