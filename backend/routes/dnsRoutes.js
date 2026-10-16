import { Router } from 'express';
import { performDnsLookup } from '../services/dnsService.js';
import { recordLookup } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const domain = req.query.domain || req.query.q;
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a domain name (e.g. ?domain=example.com).'
      });
    }

    const data = await performDnsLookup(domain);

    // Save history asynchronously
    const summary = {
      a: data.records.A.status === 'Found' ? data.records.A.records : [],
      mxCount: data.records.MX.records.length,
      nsCount: data.records.NS.records.length
    };
    recordLookup({
      lookup_type: 'dns',
      query_value: domain,
      status: 'success',
      result_summary: summary
    }).catch(err => console.warn('History record failed:', err.message));

    return res.json({
      success: true,
      type: 'dns',
      query: domain,
      data
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
