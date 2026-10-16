import { Router } from 'express';
import { runAccuracyVerificationSuite } from '../services/accuracyService.js';

const router = Router();

/**
 * GET /api/accuracy/verify
 * Runs the complete automated diagnostic suite and returns accuracy percentage
 */
router.get('/verify', async (req, res, next) => {
  try {
    const report = await runAccuracyVerificationSuite();
    return res.json(report);
  } catch (err) {
    return next(err);
  }
});

// Alias POST for programmatic or trigger calls
router.post('/verify', async (req, res, next) => {
  try {
    const report = await runAccuracyVerificationSuite();
    return res.json(report);
  } catch (err) {
    return next(err);
  }
});

export default router;
