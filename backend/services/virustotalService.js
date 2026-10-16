import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import validator from 'validator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const VT_BASE_URL = 'https://www.virustotal.com/api/v3';

/**
 * Retrieve the active VirusTotal API Key
 */
export function getVirusTotalApiKey() {
  const key = process.env.VIRUSTOTAL_API_KEY?.trim();
  if (key && key !== 'your_virustotal_api_key_here' && key.length >= 32) {
    return key;
  }
  return null;
}

/**
 * Check if VirusTotal is configured
 */
export function isVirusTotalConfigured() {
  return Boolean(getVirusTotalApiKey());
}

/**
 * Get service status and masked key
 */
export function getVirusTotalStatus() {
  const key = getVirusTotalApiKey();
  if (!key) {
    return {
      configured: false,
      provider: 'VirusTotal API v3',
      message: 'VirusTotal API key not configured. Add VIRUSTOTAL_API_KEY in .env.'
    };
  }
  const masked = `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
  return {
    configured: true,
    provider: 'VirusTotal API v3',
    keyMasked: masked,
    message: 'VirusTotal API v3 is active and operational.'
  };
}

/**
 * Generic VirusTotal v3 API Request Handler
 */
async function vtFetch(endpoint, options = {}) {
  const apiKey = getVirusTotalApiKey();
  if (!apiKey) {
    throw new Error('VirusTotal API key is not configured. Please set VIRUSTOTAL_API_KEY in backend/.env.');
  }

  const url = `${VT_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'x-apikey': apiKey,
        'Accept': 'application/json',
        ...(options.headers || {})
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => null);

    if (res.status === 404) {
      return { notFound: true, errorData: data };
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error('VirusTotal authentication failed. Please check your VIRUSTOTAL_API_KEY.');
    }

    if (res.status === 429) {
      throw new Error('VirusTotal API rate limit reached. Please wait a moment before trying again.');
    }

    if (!res.ok) {
      const errMsg = data?.error?.message || `VirusTotal error (HTTP ${res.status})`;
      throw new Error(errMsg);
    }

    return { notFound: false, data };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('VirusTotal scan request timed out. Please try again.');
    }
    throw err;
  }
}

/**
 * Format and order security engine analysis results
 */
function formatEnginesList(resultsMap = {}) {
  const list = Object.entries(resultsMap).map(([engineName, details]) => ({
    engine: engineName,
    category: details.category || 'undetected', // 'malicious', 'suspicious', 'harmless', 'undetected'
    result: details.result || 'Clean',
    method: details.method || 'blacklist',
    updateDate: details.engine_update || null
  }));

  // Order priority: malicious first, then suspicious, then harmless, then undetected
  const categoryPriority = {
    malicious: 1,
    suspicious: 2,
    harmless: 3,
    undetected: 4
  };

  return list.sort((a, b) => {
    const pA = categoryPriority[a.category] || 5;
    const pB = categoryPriority[b.category] || 5;
    if (pA !== pB) return pA - pB;
    return a.engine.localeCompare(b.engine);
  });
}

/**
 * Compute standardized threat risk metrics
 */
function computeRiskAssessment(stats = {}) {
  const malicious = stats.malicious || 0;
  const suspicious = stats.suspicious || 0;
  const harmless = stats.harmless || 0;
  const undetected = stats.undetected || 0;
  const timeout = stats.timeout || 0;
  const totalEngines = malicious + suspicious + harmless + undetected + timeout;

  let verdict = 'Clean / Harmless';
  let riskLevel = 'clean'; // 'critical' | 'high' | 'medium' | 'clean' | 'unrated'

  if (malicious >= 5) {
    verdict = 'Malicious Threat Detected';
    riskLevel = 'critical';
  } else if (malicious >= 1) {
    verdict = 'Malicious Threat Detected';
    riskLevel = 'high';
  } else if (suspicious >= 2) {
    verdict = 'Suspicious Activity Detected';
    riskLevel = 'medium';
  } else if (suspicious === 1) {
    verdict = 'Potentially Suspicious';
    riskLevel = 'medium';
  } else if (harmless === 0 && undetected === 0) {
    verdict = 'No Analysis Data';
    riskLevel = 'unrated';
  }

  const detectionRate = totalEngines > 0 ? `${malicious}/${totalEngines}` : '0/0';
  const maliciousPercentage = totalEngines > 0 ? Math.round((malicious / totalEngines) * 100) : 0;

  return {
    malicious,
    suspicious,
    harmless,
    undetected,
    timeout,
    totalEngines,
    verdict,
    riskLevel,
    detectionRate,
    maliciousPercentage
  };
}

/**
 * Helper to encode URL into VirusTotal v3 URL identifier (base64url without padding)
 */
export function encodeVtUrlId(url) {
  return Buffer.from(url.trim())
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * 1. Scan IP Address
 */
export async function performIpScan(rawIp) {
  const ip = (rawIp || '').trim();
  if (!ip) throw new Error('Please specify an IP address to scan.');

  if (!validator.isIP(ip)) {
    throw new Error(`Invalid IP address: "${ip}". Please provide a valid IPv4 or IPv6 address.`);
  }

  const res = await vtFetch(`/ip_addresses/${encodeURIComponent(ip)}`);

  if (res.notFound) {
    return {
      target: ip,
      targetType: 'ip',
      found: false,
      message: `No existing threat telemetry found in VirusTotal database for IP ${ip}.`,
      summary: computeRiskAssessment({}),
      reputation: 0,
      engines: []
    };
  }

  const attr = res.data?.data?.attributes || {};
  const stats = attr.last_analysis_stats || {};
  const risk = computeRiskAssessment(stats);
  const engines = formatEnginesList(attr.last_analysis_results);

  return {
    target: ip,
    targetType: 'ip',
    found: true,
    summary: risk,
    reputation: attr.reputation ?? 0,
    network: attr.network || null,
    asOwner: attr.as_owner || null,
    asn: attr.asn || null,
    country: attr.country || null,
    continent: attr.continent || null,
    whois: attr.whois ? attr.whois.substring(0, 1000) : null,
    tags: attr.tags || [],
    lastAnalysisDate: attr.last_analysis_date ? new Date(attr.last_analysis_date * 1000).toISOString() : null,
    permalink: `https://www.virustotal.com/gui/ip-address/${encodeURIComponent(ip)}`,
    engines
  };
}

/**
 * 2. Scan Domain
 */
export async function performDomainScan(rawDomain) {
  let domain = (rawDomain || '').trim();
  if (!domain) throw new Error('Please specify a domain to scan.');

  // Clean protocol and trailing paths if provided
  domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split(':')[0].toLowerCase();

  const res = await vtFetch(`/domains/${encodeURIComponent(domain)}`);

  if (res.notFound) {
    return {
      target: domain,
      targetType: 'domain',
      found: false,
      message: `No existing threat telemetry found in VirusTotal database for domain ${domain}.`,
      summary: computeRiskAssessment({}),
      reputation: 0,
      engines: []
    };
  }

  const attr = res.data?.data?.attributes || {};
  const stats = attr.last_analysis_stats || {};
  const risk = computeRiskAssessment(stats);
  const engines = formatEnginesList(attr.last_analysis_results);

  return {
    target: domain,
    targetType: 'domain',
    found: true,
    summary: risk,
    reputation: attr.reputation ?? 0,
    categories: attr.categories || {},
    popularity: attr.popularity_ranks || {},
    registrar: attr.registrar || null,
    creationDate: attr.creation_date ? new Date(attr.creation_date * 1000).toISOString() : null,
    lastDnsRecords: attr.last_dns_records ? attr.last_dns_records.slice(0, 10) : [],
    tags: attr.tags || [],
    lastAnalysisDate: attr.last_analysis_date ? new Date(attr.last_analysis_date * 1000).toISOString() : null,
    permalink: `https://www.virustotal.com/gui/domain/${encodeURIComponent(domain)}`,
    engines
  };
}

/**
 * 3. Scan File Hash (MD5, SHA-1, SHA-256)
 */
export async function performFileHashScan(rawHash) {
  const hash = (rawHash || '').trim().toLowerCase();
  if (!hash) throw new Error('Please specify a file hash (MD5, SHA-1, or SHA-256).');

  const isMd5 = /^[a-f0-9]{32}$/.test(hash);
  const isSha1 = /^[a-f0-9]{40}$/.test(hash);
  const isSha256 = /^[a-f0-9]{64}$/.test(hash);

  if (!isMd5 && !isSha1 && !isSha256) {
    throw new Error(`Invalid file hash: "${rawHash}". Must be 32 (MD5), 40 (SHA-1), or 64 (SHA-256) hexadecimal characters.`);
  }

  const hashType = isSha256 ? 'SHA-256' : (isSha1 ? 'SHA-1' : 'MD5');
  const res = await vtFetch(`/files/${hash}`);

  if (res.notFound) {
    return {
      target: hash,
      hashType,
      targetType: 'file',
      found: false,
      message: `No security records found in VirusTotal for this ${hashType} hash. It has not been observed or submitted before.`,
      summary: computeRiskAssessment({}),
      reputation: 0,
      engines: []
    };
  }

  const attr = res.data?.data?.attributes || {};
  const stats = attr.last_analysis_stats || {};
  const risk = computeRiskAssessment(stats);
  const engines = formatEnginesList(attr.last_analysis_results);

  // Extract popular threat names
  const threatNames = [];
  if (attr.popular_threat_classification?.suggested_threat_label) {
    threatNames.push(attr.popular_threat_classification.suggested_threat_label);
  }
  if (Array.isArray(attr.popular_threat_classification?.popular_threat_category)) {
    attr.popular_threat_classification.popular_threat_category.forEach(item => {
      if (item.value) threatNames.push(item.value);
    });
  }

  return {
    target: hash,
    hashType,
    targetType: 'file',
    found: true,
    summary: risk,
    reputation: attr.reputation ?? 0,
    fileName: attr.meaningful_name || attr.names?.[0] || 'Unknown File',
    allNames: attr.names || [],
    fileType: attr.type_description || attr.type_extension || 'Binary',
    fileSize: attr.size || null,
    md5: attr.md5 || (isMd5 ? hash : null),
    sha1: attr.sha1 || (isSha1 ? hash : null),
    sha256: attr.sha256 || (isSha256 ? hash : null),
    threatNames: [...new Set(threatNames)],
    magic: attr.magic || null,
    tags: attr.tags || [],
    lastAnalysisDate: attr.last_analysis_date ? new Date(attr.last_analysis_date * 1000).toISOString() : null,
    permalink: `https://www.virustotal.com/gui/file/${attr.sha256 || hash}`,
    engines
  };
}

/**
 * 4. Scan URL (Lookup existing or submit for analysis)
 */
export async function performUrlScan(rawUrl, forceRescan = false) {
  let url = (rawUrl || '').trim();
  if (!url) throw new Error('Please specify a URL to scan.');

  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const urlId = encodeVtUrlId(url);

  // If not force rescan, check existing report first
  if (!forceRescan) {
    const res = await vtFetch(`/urls/${urlId}`);

    if (!res.notFound) {
      const attr = res.data?.data?.attributes || {};
      const stats = attr.last_analysis_stats || {};
      const risk = computeRiskAssessment(stats);
      const engines = formatEnginesList(attr.last_analysis_results);

      return {
        target: url,
        targetType: 'url',
        found: true,
        summary: risk,
        reputation: attr.reputation ?? 0,
        categories: attr.categories || {},
        title: attr.title || null,
        finalUrl: attr.last_final_url || url,
        tags: attr.tags || [],
        lastAnalysisDate: attr.last_analysis_date ? new Date(attr.last_analysis_date * 1000).toISOString() : null,
        permalink: `https://www.virustotal.com/gui/url/${urlId}`,
        engines
      };
    }
  }

  // Submit URL for scan
  const submitRes = await vtFetch('/urls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ url })
  });

  const analysisId = submitRes.data?.data?.id;

  // Poll analysis briefly or return submission status
  let analysisAttr = null;
  if (analysisId) {
    try {
      await new Promise(r => setTimeout(r, 2000));
      const aRes = await vtFetch(`/analyses/${analysisId}`);
      analysisAttr = aRes.data?.data?.attributes;
    } catch {
      // Continue with whatever info we have
    }
  }

  const stats = analysisAttr?.stats || {};
  const risk = computeRiskAssessment(stats);
  const engines = formatEnginesList(analysisAttr?.results);

  return {
    target: url,
    targetType: 'url',
    found: true,
    queued: analysisAttr?.status === 'queued',
    summary: risk,
    reputation: 0,
    categories: {},
    tags: [],
    lastAnalysisDate: new Date().toISOString(),
    permalink: `https://www.virustotal.com/gui/url/${urlId}`,
    engines,
    message: analysisAttr?.status === 'queued'
      ? 'URL analysis queued on VirusTotal. Results will update as engines finish analyzing.'
      : 'URL scan submitted and completed.'
  };
}

/**
 * 5. Universal Threat Scan with Auto-Detection
 */
export async function performUniversalScan(rawQuery, preferredType = 'auto') {
  if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
    throw new Error('Please enter a target to scan (domain, IP, URL, or file hash).');
  }

  const query = rawQuery.trim();
  const type = preferredType.toLowerCase();

  // If explicit type requested
  if (type === 'ip') return performIpScan(query);
  if (type === 'domain') return performDomainScan(query);
  if (type === 'url') return performUrlScan(query);
  if (type === 'file' || type === 'hash') return performFileHashScan(query);

  // Auto-detection:
  // 1. File Hash Check (MD5 32, SHA1 40, SHA256 64 hex chars)
  if (/^[a-fA-F0-9]{32}$/.test(query) || /^[a-fA-F0-9]{40}$/.test(query) || /^[a-fA-F0-9]{64}$/.test(query)) {
    return performFileHashScan(query);
  }

  // 2. IP Address Check
  if (validator.isIP(query)) {
    return performIpScan(query);
  }

  // 3. URL Check (explicit protocol or has path/query)
  if (/^https?:\/\//i.test(query) || (query.includes('/') && query.includes('.'))) {
    return performUrlScan(query);
  }

  // 4. Domain Check (fallback to domain)
  return performDomainScan(query);
}
