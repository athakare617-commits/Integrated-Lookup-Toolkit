import { Router } from 'express';
import { performNameLookup } from '../services/nameService.js';
import { recordLookup } from '../config/supabase.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const name = req.query.name || req.query.q;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a name to query (e.g. ?name=John%20Smith).'
      });
    }

    const data = await performNameLookup(name);

    recordLookup({
      lookup_type: 'name',
      query_value: name,
      status: 'success',
      result_summary: {
        normalizedName: data.normalizedName,
        status: data.searchStatus
      }
    }).catch(err => console.warn('History record failed:', err.message));

    return res.json({
      success: true,
      type: 'name',
      query: name,
      data
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
