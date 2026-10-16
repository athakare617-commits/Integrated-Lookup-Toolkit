import net from 'node:net';
import validator from 'validator';
import { normalizeDomain } from './dnsService.js';
import { performDomainScan } from './virustotalService.js';

/**
 * Direct RFC 3912 TCP WHOIS query client
 * Uses native Node.js net sockets with strict timeouts, zero shell command execution.
 */
function queryWhoisSocket(domain, server = 'whois.iana.org', port = 43, timeout = 7000) {
  return new Promise((resolve, reject) => {
    let response = '';
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.connect(port, server, () => {
      socket.write(`${domain}\r\n`);
    });

    socket.on('data', (data) => {
      response += data.toString();
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('WHOIS query timed out.'));
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });

    socket.on('close', () => {
      resolve(response);
    });
  });
}

/**
 * Query RDAP (Registration Data Access Protocol - RFC 7482/9082)
 * Modern ICANN standard JSON WHOIS endpoint
 */
async function queryRdap(domain) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: { 'Accept': 'application/rdap+json, application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {
    // RDAP query fallback
  } finally {
    clearTimeout(timeoutId);
  }
  return null;
}

/**
 * Extract field by regex from plain text WHOIS
 */
function extractField(text, regexList) {
  for (const reg of regexList) {
    const match = text.match(reg);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Parse plain-text WHOIS output into structured fields
 */
function parseRawWhois(rawText, domain) {
  if (!rawText || rawText.trim().length === 0) return null;

  const registrar = extractField(rawText, [
    /Registrar:\s*([^\r\n]+)/i,
    /Sponsoring Registrar:\s*([^\r\n]+)/i,
    /registrar-name:\s*([^\r\n]+)/i
  ]);

  const creationDate = extractField(rawText, [
    /Creation Date:\s*([^\r\n]+)/i,
    /Created:\s*([^\r\n]+)/i,
    /created-date:\s*([^\r\n]+)/i,
    /Registration Time:\s*([^\r\n]+)/i
  ]);

  const updatedDate = extractField(rawText, [
    /Updated Date:\s*([^\r\n]+)/i,
    /Last Modified:\s*([^\r\n]+)/i,
    /last-update:\s*([^\r\n]+)/i
  ]);

  const expirationDate = extractField(rawText, [
    /Registry Expiry Date:\s*([^\r\n]+)/i,
    /Registrar Registration Expiration Date:\s*([^\r\n]+)/i,
    /Expiry Date:\s*([^\r\n]+)/i,
    /expiration-date:\s*([^\r\n]+)/i
  ]);

  const statusMatches = [...rawText.matchAll(/Domain Status:\s*([^\r\n\s]+)/gi)].map(m => m[1]);
  const nameServerMatches = [...rawText.matchAll(/Name Server:\s*([^\r\n\s]+)/gi)].map(m => m[1].toLowerCase());

  const uniqueNameServers = [...new Set(nameServerMatches)];
  const uniqueStatuses = [...new Set(statusMatches)];

  return {
    domain: domain,
    domainName: domain,
    registrar: registrar || 'Unavailable / Redacted',
    creationDate: creationDate || 'Unavailable',
    updatedDate: updatedDate || 'Unavailable',
    expirationDate: expirationDate || 'Unavailable',
    nameServers: uniqueNameServers.length > 0 ? uniqueNameServers : ['Unavailable'],
    domainStatus: uniqueStatuses.length > 0 ? uniqueStatuses : ['Active / Unknown'],
    rawWhois: rawText.substring(0, 3000) // snippet for transparency
  };
}

/**
 * Perform WHOIS lookup on a domain
 */
export async function performWhoisLookup(rawDomain) {
  const domain = normalizeDomain(rawDomain);

  if (!domain) {
    throw new Error('Please enter a domain name.');
  }

  const isValidFqdn = validator.isFQDN(domain, { require_tld: true });
  if (!isValidFqdn) {
    throw new Error(`Invalid domain name: "${domain}". Please enter a valid domain (e.g. example.com).`);
  }

  const [whoisData, vtOutcome] = await Promise.all([
    (async () => {
      // Strategy 1: RDAP lookup (JSON standard)
      try {
        const rdap = await queryRdap(domain);
        if (rdap && rdap.ldhName) {
          let registrar = 'Unavailable';
          if (Array.isArray(rdap.entities)) {
            const registrarEntity = rdap.entities.find(e => Array.isArray(e.roles) && e.roles.includes('registrar'));
            if (registrarEntity?.vcardArray?.[1]) {
              const fn = registrarEntity.vcardArray[1].find(item => item[0] === 'fn');
              if (fn && fn[3]) registrar = fn[3];
            }
          }

          let creationDate = 'Unavailable';
          let updatedDate = 'Unavailable';
          let expirationDate = 'Unavailable';

          if (Array.isArray(rdap.events)) {
            for (const ev of rdap.events) {
              if (ev.eventAction === 'registration') creationDate = ev.eventDate;
              if (ev.eventAction === 'last changed') updatedDate = ev.eventDate;
              if (ev.eventAction === 'expiration') expirationDate = ev.eventDate;
            }
          }

          let nameServers = [];
          if (Array.isArray(rdap.nameservers)) {
            nameServers = rdap.nameservers.map(ns => ns.ldhName?.toLowerCase()).filter(Boolean);
          }

          return {
            domain: domain,
            domainName: domain,
            registrar,
            creationDate,
            updatedDate,
            expirationDate,
            nameServers: nameServers.length > 0 ? nameServers : ['Unavailable'],
            domainStatus: Array.isArray(rdap.status) ? rdap.status : ['Active'],
            source: 'RDAP (ICANN RFC 7482)',
            isAvailable: true
          };
        }
      } catch {
        // Continue to RFC 3912 TCP fallback
      }

      // Strategy 2: RFC 3912 TCP socket query
      try {
        const ianaResponse = await queryWhoisSocket(domain, 'whois.iana.org');
        const referServer = extractField(ianaResponse, [/refer:\s*([^\r\n]+)/i, /whois:\s*([^\r\n]+)/i]);

        let rawData = ianaResponse;
        if (referServer) {
          try {
            const tldResponse = await queryWhoisSocket(domain, referServer);
            if (tldResponse && tldResponse.trim().length > 0) {
              rawData = tldResponse;
            }
          } catch {
            // Keep iana response if TLD whois fails
          }
        }

        const parsed = parseRawWhois(rawData, domain);
        if (parsed) {
          return {
            ...parsed,
            source: 'RFC 3912 WHOIS',
            isAvailable: true
          };
        }
      } catch (err) {
        console.warn(`WHOIS lookup socket error for ${domain}:`, err.message);
      }

      // Graceful fallback
      return {
        domain: domain,
        domainName: domain,
        registrar: 'Unavailable',
        creationDate: 'Unavailable',
        updatedDate: 'Unavailable',
        expirationDate: 'Unavailable',
        nameServers: [],
        domainStatus: [],
        isAvailable: false,
        message: 'WHOIS information is unavailable for this domain.'
      };
    })(),
    (async () => {
      try {
        return await performDomainScan(domain);
      } catch (err) {
        console.warn('VirusTotal domain scan skipped:', err.message);
        return null;
      }
    })()
  ]);

  return {
    ...whoisData,
    threatScan: vtOutcome
  };
}
