import { Router } from 'express';
import { performIpLookup } from '../services/ipService.js';
import { recordLookup } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const ip = req.query.ip || req.query.q;
    if (!ip) {
      return res.status(400).json({
        success: false,
        error: 'Please enter an IP address (e.g. ?ip=8.8.8.8).'
      });
    }

    const data = await performIpLookup(ip);

    recordLookup({
      lookup_type: 'ip',
      query_value: ip,
      status: 'success',
      result_summary: {
        version: data.ipVersion,
        hostname: data.hostname,
        networkType: data.networkType
      }
    }).catch(err => console.warn('History record failed:', err.message));

    return res.json({
      success: true,
      type: 'ip',
      query: ip,
      data
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
