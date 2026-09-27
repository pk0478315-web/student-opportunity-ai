// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================
// In Express, a middleware with 4 arguments (err, req, res, next)
// is recognized as an Error Handler.
// Whenever any controller or route encounters an unexpected error,
// this middleware catches it and sends a clean JSON error response
// instead of crashing the server.

const errorHandler = (err, req, res, next) => {
  console.error("❌ An error occurred:", err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message
  });
};

module.exports = errorHandler;
