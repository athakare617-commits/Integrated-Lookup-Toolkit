import dns from 'node:dns';
import validator from 'validator';
import { performDomainScan } from './virustotalService.js';

const dnsPromises = dns.promises;

// Set default timeout and public resolvers if necessary
// Using default system DNS resolvers provides authentic lookup behavior

/**
 * Clean and normalize a domain or hostname input
 */
export function normalizeDomain(input) {
  if (!input || typeof input !== 'string') return '';
  let cleaned = input.trim().toLowerCase();
  // Strip protocol if user pasted full URL
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, '');
  // Strip path, query params, hash
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];
  // Strip port
  cleaned = cleaned.split(':')[0];
  return cleaned;
}

/**
 * RFC 8484 DNS over HTTPS query fallback for environments where local router/firewall
 * drops or throttles raw UDP port 53 packets (common for large TXT records on consumer gateways).
 */
async function resolveViaDoH(domain, typeName) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(typeName)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.Answer || !Array.isArray(json.Answer) || json.Answer.length === 0) {
      return [];
    }

    if (typeName === 'A') {
      return json.Answer.filter(a => a.type === 1).map(a => a.data);
    }
    if (typeName === 'AAAA') {
      return json.Answer.filter(a => a.type === 28).map(a => a.data);
    }
    if (typeName === 'MX') {
      return json.Answer.filter(a => a.type === 15).map(a => {
        const parts = (a.data || '').split(' ');
        return {
          priority: parseInt(parts[0], 10) || 0,
          exchange: parts[1] || parts[0]
        };
      });
    }
    if (typeName === 'NS') {
      return json.Answer.filter(a => a.type === 2).map(a => (a.data || '').replace(/\.$/, ''));
    }
    if (typeName === 'TXT') {
      return json.Answer.filter(a => a.type === 16).map(a => {
        const clean = (a.data || '').replace(/^"|"$/g, '');
        return [clean];
      });
    }
    return [];
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Helper to safely query a specific DNS record type
 */
async function safeResolve(fn, domain, typeName) {
  try {
    const result = await fn(domain);
    if (result && Array.isArray(result) && result.length > 0) {
      return {
        type: typeName,
        status: 'Found',
        records: result,
        message: `${typeName} record(s) resolved successfully.`
      };
    }
  } catch (err) {
    // If native UDP DNS times out, connection refused, or fails, attempt live DoH query
    if (err.code === 'ETIMEOUT' || err.code === 'ECONNREFUSED' || err.code === 'ESERVFAIL') {
      const fallbackResult = await resolveViaDoH(domain, typeName);
      if (fallbackResult && fallbackResult.length > 0) {
        return {
          type: typeName,
          status: 'Found',
          records: fallbackResult,
          message: `${typeName} record(s) resolved successfully.`
        };
      }
    }
  }

  // Also check DoH fallback for TXT if empty (since large TXT answers are most prone to UDP truncation)
  if (typeName === 'TXT') {
    const fallbackResult = await resolveViaDoH(domain, typeName);
    if (fallbackResult && fallbackResult.length > 0) {
      return {
        type: typeName,
        status: 'Found',
        records: fallbackResult,
        message: `${typeName} record(s) resolved successfully.`
      };
    }
  }

  return {
    type: typeName,
    status: 'Not Found',
    records: [],
    message: `No ${typeName} records found for this domain.`
  };
}

/**
 * Perform full DNS Lookup on a domain
 * Returns A, AAAA, MX, NS, TXT, and PTR
 */
export async function performDnsLookup(rawDomain) {
  const domain = normalizeDomain(rawDomain);

  if (!domain) {
    throw new Error('Please enter a valid domain name.');
  }

  // Validate domain format (allow standard FQDN)
  const isValidFqdn = validator.isFQDN(domain, { require_tld: true }) || domain === 'localhost';
  if (!isValidFqdn && !validator.isIP(domain)) {
    throw new Error(`Invalid domain name format: "${domain}". Please provide a valid domain (e.g. example.com).`);
  }

  // Execute queries in parallel for high performance, including live VirusTotal threat scan
  const [aRes, aaaaRes, mxRes, nsRes, txtRes, vtRes] = await Promise.all([
    safeResolve(d => dnsPromises.resolve4(d), domain, 'A'),
    safeResolve(d => dnsPromises.resolve6(d), domain, 'AAAA'),
    safeResolve(d => dnsPromises.resolveMx(d), domain, 'MX'),
    safeResolve(d => dnsPromises.resolveNs(d), domain, 'NS'),
    safeResolve(d => dnsPromises.resolveTxt(d), domain, 'TXT'),
    (async () => {
      try {
        return await performDomainScan(domain);
      } catch (err) {
        console.warn('VirusTotal domain scan skipped:', err.message);
        return null;
      }
    })()
  ]);

  // Format TXT records (Node returns array of arrays of strings: [['v=spf1 ...']])
  let formattedTxt = [];
  if (txtRes.status === 'Found' && Array.isArray(txtRes.records)) {
    formattedTxt = txtRes.records.map(chunk => Array.isArray(chunk) ? chunk.join('') : String(chunk));
  }

  // Try PTR lookup if domain resolves to an A record
  let ptrRes = {
    type: 'PTR',
    status: 'Not Found',
    records: [],
    message: 'PTR lookup is typically performed directly on IP addresses.'
  };

  if (aRes.status === 'Found' && aRes.records.length > 0) {
    try {
      const firstIp = aRes.records[0];
      const hostnames = await dnsPromises.reverse(firstIp);
      if (hostnames && hostnames.length > 0) {
        ptrRes = {
          type: 'PTR',
          status: 'Found',
          records: hostnames,
          targetIp: firstIp,
          message: `Reverse PTR for resolved IPv4 (${firstIp})`
        };
      }
    } catch {
      // Ignore reverse error on domain A record
    }
  }

  // Record explanations
  const recordExplanations = {
    A: 'Maps a domain name to an IPv4 address (32-bit numerical label).',
    AAAA: 'Maps a domain name to an IPv6 address (128-bit hexadecimal label).',
    MX: 'Specifies mail exchange servers responsible for routing incoming email.',
    NS: 'Identifies the authoritative DNS nameservers for the domain zone.',
    TXT: 'Contains text notes, verification codes, and SPF/DKIM policy records.',
    PTR: 'Pointer record used in reverse DNS lookups to map an IP address back to a hostname.'
  };

  const records = {
    A: {
      ...aRes,
      explanation: recordExplanations.A
    },
    AAAA: {
      ...aaaaRes,
      explanation: recordExplanations.AAAA
    },
    MX: {
      ...mxRes,
      records: Array.isArray(mxRes.records) ? mxRes.records.sort((a, b) => (a.priority || 0) - (b.priority || 0)) : [],
      explanation: recordExplanations.MX
    },
    NS: {
      ...nsRes,
      explanation: recordExplanations.NS
    },
    TXT: {
      ...txtRes,
      records: formattedTxt,
      explanation: recordExplanations.TXT
    },
    PTR: {
      ...ptrRes,
      explanation: recordExplanations.PTR
    }
  };

  const anyFound = Object.values(records).some(r => r.status === 'Found');

  return {
    domain,
    queryTime: new Date().toISOString(),
    overallStatus: anyFound ? 'Success' : 'No records found',
    records,
    threatScan: vtRes
  };
}
