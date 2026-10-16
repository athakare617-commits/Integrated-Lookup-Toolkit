import dns from 'node:dns';
import validator from 'validator';
import { performIpScan } from './virustotalService.js';

const dnsPromises = dns.promises;

/**
 * Determine network classification for an IPv4 address
 */
function getIpv4Classification(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return { type: 'Unknown', isPrivate: false };
  const first = parts[0];

  if (first === 10 || (first === 172 && parts[1] >= 16 && parts[1] <= 31) || (first === 192 && parts[1] === 168)) {
    return { type: 'Private Network (RFC 1918)', isPrivate: true };
  }
  if (first === 127) {
    return { type: 'Loopback Address (RFC 1122)', isPrivate: true };
  }
  if (first >= 224 && first <= 239) {
    return { type: 'Multicast Range (Class D)', isPrivate: false };
  }
  if (first >= 240 && first <= 255) {
    return { type: 'Reserved / Future Use (Class E)', isPrivate: false };
  }
  if (first === 169 && parts[1] === 254) {
    return { type: 'Link-Local Address (APIPA)', isPrivate: true };
  }
  return { type: 'Public Internet Routable', isPrivate: false };
}

/**
 * Determine network classification for IPv6
 */
function getIpv6Classification(ip) {
  const clean = ip.toLowerCase();
  if (clean === '::1') return { type: 'Loopback (::1)', isPrivate: true };
  if (clean.startsWith('fe80:')) return { type: 'Link-Local Unicast', isPrivate: true };
  if (clean.startsWith('fc00:') || clean.startsWith('fd00:')) return { type: 'Unique Local Address (ULA)', isPrivate: true };
  if (clean.startsWith('ff00:')) return { type: 'Multicast', isPrivate: false };
  return { type: 'Global Unicast Address (GUA)', isPrivate: false };
}

/**
 * Real Live Geolocation & ASN Querying
 * Queries authentic public registry telemetry.
 * If private or unreachable, returns authentic explanatory status without fake values.
 */
async function fetchRealGeolocation(ip, isPrivate) {
  if (isPrivate) {
    return {
      status: 'Private IP',
      message: 'RFC 1918 Private / Internal IP addresses are not routable on the public Internet and have no public registry geolocation.'
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          status: 'Available',
          country: data.country || 'Unavailable',
          countryCode: data.countryCode || '',
          region: data.regionName || data.region || 'Unavailable',
          city: data.city || 'Unavailable',
          zip: data.zip || 'Unavailable',
          isp: data.isp || 'Unavailable',
          org: data.org || data.isp || 'Unavailable',
          asn: data.as || 'Unavailable',
          timezone: data.timezone || 'Unavailable',
          latitude: data.lat ?? null,
          longitude: data.lon ?? null
        };
      }
    }
  } catch (err) {
    // Network or abort error
  } finally {
    clearTimeout(timeoutId);
  }

  return {
    status: 'Data unavailable',
    message: 'Public registry geolocation data could not be retrieved for this IP.'
  };
}

/**
 * Perform IP address inspection & reverse DNS
 */
export async function performIpLookup(rawIp) {
  const ip = (rawIp || '').trim();

  if (!ip) {
    throw new Error('Please enter an IP address.');
  }

  const isV4 = validator.isIP(ip, 4);
  const isV6 = validator.isIP(ip, 6);

  if (!isV4 && !isV6) {
    throw new Error(`Invalid IP address: "${ip}". Please provide a valid IPv4 or IPv6 address.`);
  }

  const ipVersion = isV4 ? 'IPv4' : 'IPv6';
  const networkClass = isV4 ? getIpv4Classification(ip) : getIpv6Classification(ip);

  // Parallel execution of reverse PTR lookup, live Geolocation/ASN, and VirusTotal threat scan
  const [ptrOutcome, geoOutcome, vtOutcome] = await Promise.all([
    (async () => {
      try {
        const hostnames = await dnsPromises.reverse(ip);
        if (hostnames && hostnames.length > 0) {
          return {
            hostname: hostnames[0],
            ptrRecords: hostnames,
            ptrStatus: 'Found'
          };
        }
      } catch {
        // Reverse DNS not available for this IP
      }
      return {
        hostname: 'No PTR record found',
        ptrRecords: [],
        ptrStatus: 'No PTR record found'
      };
    })(),
    fetchRealGeolocation(ip, networkClass.isPrivate),
    (async () => {
      try {
        if (!networkClass.isPrivate) {
          return await performIpScan(ip);
        }
      } catch (err) {
        console.warn('VirusTotal IP scan skipped:', err.message);
      }
      return null;
    })()
  ]);

  return {
    ip,
    ipVersion,
    isValid: true,
    networkType: networkClass.type,
    isPrivate: networkClass.isPrivate,
    hostname: ptrOutcome.hostname,
    ptrStatus: ptrOutcome.ptrStatus,
    ptrRecords: ptrOutcome.ptrRecords,
    geolocation: geoOutcome,
    threatScan: vtOutcome
  };
}

/**
 * Dedicated Reverse DNS / PTR Lookup
 */
export async function performReverseDnsLookup(rawIp) {
  const ip = (rawIp || '').trim();

  if (!ip) {
    throw new Error('Please enter an IP address for reverse DNS.');
  }

  const isV4 = validator.isIP(ip, 4);
  const isV6 = validator.isIP(ip, 6);

  if (!isV4 && !isV6) {
    throw new Error(`Invalid IP address: "${ip}". Please provide a valid IPv4 or IPv6 address.`);
  }

  const [hostnamesOutcome, vtOutcome] = await Promise.all([
    (async () => {
      try {
        const hostnames = await dnsPromises.reverse(ip);
        if (hostnames && hostnames.length > 0) {
          return {
            status: 'Found',
            hostname: hostnames[0],
            allHostnames: hostnames,
            message: `Successfully resolved ${hostnames.length} PTR record(s).`
          };
        }
        return {
          status: 'Not Found',
          hostname: null,
          allHostnames: [],
          message: 'No PTR record found for this IP.'
        };
      } catch (err) {
        return {
          status: 'Not Found',
          hostname: null,
          allHostnames: [],
          message: err.code === 'ENOTFOUND' ? 'No PTR record found.' : (err.message || 'Reverse DNS lookup failed.')
        };
      }
    })(),
    (async () => {
      try {
        return await performIpScan(ip);
      } catch {
        return null;
      }
    })()
  ]);

  return {
    ip,
    ipVersion: isV4 ? 'IPv4' : 'IPv6',
    status: hostnamesOutcome.status,
    hostname: hostnamesOutcome.hostname,
    allHostnames: hostnamesOutcome.allHostnames,
    message: hostnamesOutcome.message,
    threatScan: vtOutcome
  };
}
