class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function handleError(err, res) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'UNKNOWN_ERROR';
  
  res.status(statusCode).json({
    success: false,
    error: err.message,
    code,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = { AppError, handleError }; 