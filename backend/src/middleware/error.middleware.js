/**
 * Production-grade error handler middleware
 */
function errorHandler(err, req, res, next) {
  let { status, message } = err;

  // Default to 500 if status not set
  const statusCode = status || 500;
  
  // Hide stack trace in production
  const response = {
    status: 'error',
    message: statusCode === 500 && process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (statusCode === 500) {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err);
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
