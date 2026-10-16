/**
 * Centralized error handler middleware
 * Protects against leaking server internals or stack traces
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = err.status || err.statusCode;

  // If status not explicitly set, determine if it is client validation (400) or server error (500)
  if (!statusCode) {
    const msg = (err.message || '').toLowerCase();
    if (
      msg.includes('invalid') ||
      msg.includes('please enter') ||
      msg.includes('unsupported') ||
      msg.includes('missing') ||
      msg.includes('not found')
    ) {
      statusCode = 400;
    } else {
      statusCode = 500;
    }
  }

  const userMessage = err.message || 'An unexpected error occurred while processing the lookup request.';

  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err.message);

  res.status(statusCode).json({
    success: false,
    error: userMessage
  });
}

/**
 * 404 Route Not Found Handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Endpoint '${req.method} ${req.originalUrl}' not found.`
  });
}
