import { Router } from 'express';
import { performEmailLookup } from '../services/emailService.js';
import { recordLookup } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const email = req.query.email || req.query.q;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please enter an email address (e.g. ?email=user@example.com).'
      });
    }

    const data = await performEmailLookup(email);

    recordLookup({
      lookup_type: 'email',
      query_value: email,
      status: data.formatValidation === 'Valid' ? 'success' : 'failed',
      result_summary: {
        domain: data.domain,
        mxCheck: data.mxCheck,
        domainValidation: data.domainValidation
      }
    }).catch(err => console.warn('History record failed:', err.message));

    return res.json({
      success: true,
      type: 'email',
      query: email,
      data
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
