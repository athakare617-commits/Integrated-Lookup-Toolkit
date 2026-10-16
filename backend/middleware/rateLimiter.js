import rateLimit from 'express-rate-limit';

/**
 * Standard rate limiter for lookup endpoints
 * 120 requests per 10 minutes per IP
 */
export const lookupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many lookup requests from this IP. Please try again after a few minutes.'
  }
});

/**
 * Health check & stats limiter
 */
export const statsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate limit exceeded for statistics.'
  }
});
