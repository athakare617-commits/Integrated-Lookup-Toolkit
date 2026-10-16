import { Router } from 'express';
import { performWhoisLookup } from '../services/whoisService.js';
import { recordLookup } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const domain = req.query.domain || req.query.q;
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a domain name for WHOIS lookup (e.g. ?domain=example.com).'
      });
    }

    const data = await performWhoisLookup(domain);

    recordLookup({
      lookup_type: 'whois',
      query_value: domain,
      status: data.isAvailable ? 'success' : 'failed',
      result_summary: {
        registrar: data.registrar,
        expiry: data.expirationDate,
        isAvailable: data.isAvailable
      }
    }).catch(err => console.warn('History record failed:', err.message));

    return res.json({
      success: true,
      type: 'whois',
      query: domain,
      data
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
