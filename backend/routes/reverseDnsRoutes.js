import { Router } from 'express';
import { performReverseDnsLookup } from '../services/ipService.js';
import { recordLookup } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const ip = req.query.ip || req.query.q;
    if (!ip) {
      return res.status(400).json({
        success: false,
        error: 'Please enter an IP address for reverse DNS lookup (e.g. ?ip=8.8.8.8).'
      });
    }

    const data = await performReverseDnsLookup(ip);

    recordLookup({
      lookup_type: 'reverse-dns',
      query_value: ip,
      status: data.status === 'Found' ? 'success' : 'failed',
      result_summary: {
        hostname: data.hostname,
        status: data.status
      }
    }).catch(err => console.warn('History record failed:', err.message));

    return res.json({
      success: true,
      type: 'reverse-dns',
      query: ip,
      data
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
