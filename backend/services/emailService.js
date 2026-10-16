import dns from 'node:dns';
import validator from 'validator';
import { performDomainScan } from './virustotalService.js';

const dnsPromises = dns.promises;

/**
 * Educational Email Lookup Service
 * Performs syntax validation, domain extraction, MX records check, and domain DNS analysis.
 */
export async function performEmailLookup(rawEmail) {
  const email = (rawEmail || '').trim();

  if (!email) {
    throw new Error('Please enter an email address.');
  }

  // Format validation
  const isValidFormat = validator.isEmail(email);

  if (!isValidFormat) {
    return {
      email,
      formatValidation: 'Invalid',
      username: email.includes('@') ? email.split('@')[0] : email,
      domain: email.includes('@') ? email.split('@').slice(1).join('@') : '',
      domainValidation: 'Invalid Email Format',
      mxCheck: 'Not Checked',
      mxRecords: [],
      spfRecord: null,
      disclaimer: 'This tool performs technical email-domain checks and does not access private email accounts.',
      error: 'Invalid email address syntax (RFC 5322 violation).'
    };
  }

  const [username, domain] = email.split('@');
  const cleanDomain = domain.toLowerCase().trim();

  let domainValidation = 'Not Found';
  let mxCheck = 'Not Found';
  let mxRecords = [];
  let spfRecord = null;
  let hasDomainIp = false;

  try {
    // Check if domain resolves to any IP (A/AAAA)
    try {
      const aRecords = await dnsPromises.resolve4(cleanDomain);
      if (aRecords && aRecords.length > 0) {
        domainValidation = 'Exists';
        hasDomainIp = true;
      }
    } catch {
      // Check IPv6 if A fails
      try {
        const aaaa = await dnsPromises.resolve6(cleanDomain);
        if (aaaa && aaaa.length > 0) {
          domainValidation = 'Exists';
          hasDomainIp = true;
        }
      } catch {
        // Domain does not resolve to an IP
      }
    }

    // Check MX records
    try {
      const mx = await dnsPromises.resolveMx(cleanDomain);
      if (mx && mx.length > 0) {
        domainValidation = 'Exists';
        mxCheck = 'MX Available';
        mxRecords = mx.sort((a, b) => a.priority - b.priority);
      } else {
        mxCheck = 'Not Found';
      }
    } catch (mxErr) {
      mxCheck = 'Not Found';
      if (!hasDomainIp && mxErr.code === 'ENOTFOUND') {
        domainValidation = 'Not Found';
      }
    }

    // Run SPF check and VirusTotal threat reputation scan in parallel
    const [spfOutcome, vtOutcome] = await Promise.all([
      (async () => {
        try {
          const txt = await dnsPromises.resolveTxt(cleanDomain);
          if (txt && txt.length > 0) {
            const flatTxt = txt.map(c => Array.isArray(c) ? c.join('') : String(c));
            const spf = flatTxt.find(t => t.toLowerCase().startsWith('v=spf1'));
            if (spf) return spf;
          }
        } catch {
          // SPF check failure is non-blocking
        }
        return null;
      })(),
      (async () => {
        try {
          return await performDomainScan(cleanDomain);
        } catch (err) {
          console.warn('VirusTotal email domain scan skipped:', err.message);
          return null;
        }
      })()
    ]);

    spfRecord = spfOutcome;

    return {
      email,
      formatValidation: 'Valid',
      username,
      domain: cleanDomain,
      domainValidation,
      mxCheck,
      mxRecords,
      spfRecord: spfRecord || 'No SPF record found',
      disclaimer: 'This tool performs technical email-domain checks and does not access private email accounts.',
      threatScan: vtOutcome
    };
  } catch (err) {
    return {
      email,
      formatValidation: 'Valid',
      username,
      domain: cleanDomain,
      domainValidation: 'Error checking domain',
      mxCheck: 'Error',
      mxRecords: [],
      spfRecord: null,
      disclaimer: 'This tool performs technical email-domain checks and does not access private email accounts.',
      error: err.message,
      threatScan: null
    };
  }
}
