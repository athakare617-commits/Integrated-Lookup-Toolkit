import { Router } from 'express';
import { detectInputType } from '../services/detectorService.js';
import { performDnsLookup } from '../services/dnsService.js';
import { performIpLookup, performReverseDnsLookup } from '../services/ipService.js';
import { performEmailLookup } from '../services/emailService.js';
import { performWhoisLookup } from '../services/whoisService.js';
import { performNameLookup } from '../services/nameService.js';
import { performUniversalScan } from '../services/virustotalService.js';
import { recordLookup } from '../config/supabase.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { query, type = 'auto' } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a value to lookup (domain, IP, email, or name).'
      });
    }

    const trimmed = query.trim();
    let effectiveType = type?.toLowerCase();
    let detectedInfo = null;

    if (!effectiveType || effectiveType === 'auto') {
      detectedInfo = detectInputType(trimmed);
      if (!detectedInfo.type) {
        return res.status(400).json({
          success: false,
          error: 'Unable to determine input type. Please select a lookup type manually.',
          detectedType: 'unknown'
        });
      }
      effectiveType = detectedInfo.type;
    }

    let lookupResult = null;
    let summary = {};

    switch (effectiveType) {
      case 'dns':
      case 'domain':
        effectiveType = 'dns';
        lookupResult = await performDnsLookup(trimmed);
        summary = {
          a: lookupResult.records.A.status === 'Found' ? lookupResult.records.A.records : [],
          mxCount: lookupResult.records.MX.records.length
        };
        break;

      case 'ip':
        lookupResult = await performIpLookup(trimmed);
        summary = {
          version: lookupResult.ipVersion,
          hostname: lookupResult.hostname,
          networkType: lookupResult.networkType
        };
        break;

      case 'reverse-dns':
        lookupResult = await performReverseDnsLookup(trimmed);
        summary = {
          hostname: lookupResult.hostname,
          status: lookupResult.status
        };
        break;

      case 'email':
        lookupResult = await performEmailLookup(trimmed);
        summary = {
          domain: lookupResult.domain,
          mxCheck: lookupResult.mxCheck,
          valid: lookupResult.formatValidation
        };
        break;

      case 'whois':
        lookupResult = await performWhoisLookup(trimmed);
        summary = {
          registrar: lookupResult.registrar,
          available: lookupResult.isAvailable
        };
        break;

      case 'name':
        lookupResult = await performNameLookup(trimmed);
        summary = {
          normalizedName: lookupResult.normalizedName
        };
        break;

      case 'threat-scan':
      case 'scan':
        effectiveType = 'threat-scan';
        lookupResult = await performUniversalScan(trimmed);
        summary = {
          targetType: lookupResult.targetType,
          verdict: lookupResult.summary?.verdict,
          detectionRate: lookupResult.summary?.detectionRate,
          malicious: lookupResult.summary?.malicious,
          reputation: lookupResult.reputation
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported lookup type: "${effectiveType}". Options: auto, dns, ip, reverse-dns, email, whois, name, threat-scan.`
        });
    }

    // Save to history asynchronously
    recordLookup({
      lookup_type: effectiveType,
      query_value: trimmed,
      status: 'success',
      result_summary: summary
    }).catch(err => console.warn('History record failed:', err.message));

    return res.json({
      success: true,
      type: effectiveType,
      query: trimmed,
      detectedType: detectedInfo ? detectedInfo.type : effectiveType,
      detectedLabel: detectedInfo ? detectedInfo.label : effectiveType.toUpperCase(),
      data: lookupResult
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
