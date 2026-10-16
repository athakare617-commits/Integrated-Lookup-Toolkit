import { Router } from 'express';
import {
  performUniversalScan,
  performDomainScan,
  performIpScan,
  performUrlScan,
  performFileHashScan,
  getVirusTotalStatus,
  isVirusTotalConfigured
} from '../services/virustotalService.js';
import { recordLookup } from '../config/supabase.js';

const router = Router();

/**
 * GET /api/scan/status - Health check and configuration status for VirusTotal
 */
router.get('/status', (req, res) => {
  return res.json({
    success: true,
    status: getVirusTotalStatus()
  });
});

/**
 * POST /api/scan - Universal Threat Scan (IP, Domain, URL, or File Hash)
 */
router.post('/', async (req, res, next) => {
  try {
    const { query, type = 'auto' } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a target to scan (domain, IP address, URL, or file hash).'
      });
    }

    const trimmed = query.trim();
    const data = await performUniversalScan(trimmed, type);

    // Asynchronously record into lookup history
    recordLookup({
      lookup_type: 'threat-scan',
      query_value: trimmed,
      status: 'success',
      result_summary: {
        targetType: data.targetType,
        verdict: data.summary?.verdict || 'Completed',
        detectionRate: data.summary?.detectionRate || '0/0',
        malicious: data.summary?.malicious || 0,
        reputation: data.reputation ?? 0
      }
    }).catch(err => console.warn('History record failed for threat scan:', err.message));

    return res.json({
      success: true,
      type: 'threat-scan',
      query: trimmed,
      data
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/scan/domain - Scan domain threat intelligence
 */
router.get('/domain', async (req, res, next) => {
  try {
    const domain = req.query.domain || req.query.q;
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Please specify a domain to scan (?domain=example.com).'
      });
    }

    const data = await performDomainScan(domain);

    recordLookup({
      lookup_type: 'threat-scan',
      query_value: domain,
      status: 'success',
      result_summary: {
        targetType: 'domain',
        verdict: data.summary?.verdict,
        detectionRate: data.summary?.detectionRate,
        malicious: data.summary?.malicious
      }
    }).catch(err => console.warn('History record failed:', err.message));

    return res.json({
      success: true,
      type: 'threat-scan',
      targetType: 'domain',
      query: domain,
      data
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/scan/ip - Scan IP threat intelligence
 */
router.get('/ip', async (req, res, next) => {
  try {
    const ip = req.query.ip || req.query.q;
    if (!ip) {
      return res.status(400).json({
        success: false,
        error: 'Please specify an IP address to scan (?ip=8.8.8.8).'
      });
    }

    const data = await performIpScan(ip);

    recordLookup({
      lookup_type: 'threat-scan',
      query_value: ip,
      status: 'success',
      result_summary: {
        targetType: 'ip',
        verdict: data.summary?.verdict,
        detectionRate: data.summary?.detectionRate,
        malicious: data.summary?.malicious
      }
    }).catch(err => console.warn('History record failed:', err.message));

    return res.json({
      success: true,
      type: 'threat-scan',
      targetType: 'ip',
      query: ip,
      data
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/scan/url - Scan URL threat intelligence
 */
router.get('/url', async (req, res, next) => {
  try {
    const url = req.query.url || req.query.q;
    const force = req.query.force === 'true';
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Please specify a URL to scan (?url=https://example.com).'
      });
    }

    const data = await performUrlScan(url, force);

    recordLookup({
      lookup_type: 'threat-scan',
      query_value: url,
      status: 'success',
      result_summary: {
        targetType: 'url',
        verdict: data.summary?.verdict,
        detectionRate: data.summary?.detectionRate,
        malicious: data.summary?.malicious
      }
    }).catch(err => console.warn('History record failed:', err.message));

    return res.json({
      success: true,
      type: 'threat-scan',
      targetType: 'url',
      query: url,
      data
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/scan/hash - Scan File Hash (MD5, SHA-1, SHA-256)
 */
router.get('/hash', async (req, res, next) => {
  try {
    const hash = req.query.hash || req.query.q;
    if (!hash) {
      return res.status(400).json({
        success: false,
        error: 'Please specify a file hash to scan (?hash=eicar_hash).'
      });
    }

    const data = await performFileHashScan(hash);

    recordLookup({
      lookup_type: 'threat-scan',
      query_value: hash,
      status: 'success',
      result_summary: {
        targetType: 'file',
        hashType: data.hashType,
        verdict: data.summary?.verdict,
        detectionRate: data.summary?.detectionRate,
        malicious: data.summary?.malicious
      }
    }).catch(err => console.warn('History record failed:', err.message));

    return res.json({
      success: true,
      type: 'threat-scan',
      targetType: 'file',
      query: hash,
      data
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
