import { LOG_LEVELS, log } from './logger.js';

class BaseError extends Error {
  constructor(message, name, statusCode, code, metadata = {}) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.code = code;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
    
    // Preserve stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
      timestamp: this.timestamp
    };
  }

  logError(service) {
    log(LOG_LEVELS.ERROR, service, {
      error: this.toJSON(),
      stack: this.stack
    });
  }
}

class PrintavoAPIError extends BaseError {
  constructor(message, code = 'PRINTAVO_API_ERROR', metadata = {}, statusCode = 500) {
    super(message, 'PrintavoAPIError', statusCode, code, metadata);
  }
}

class PrintavoValidationError extends BaseError {
  constructor(message, validationErrors = [], metadata = {}) {
    super(
      message,
      'PrintavoValidationError',
      400,
      'VALIDATION_ERROR',
      {
        ...metadata,
        validationErrors: Array.isArray(validationErrors) ? validationErrors : [validationErrors]
      }
    );
  }
}

class PrintavoAuthenticationError extends BaseError {
  constructor(message, code = 'PRINTAVO_AUTH_ERROR', metadata = {}, statusCode = 401) {
    super(message, 'PrintavoAuthenticationError', statusCode, code, metadata);
  }
}

class SanMarAPIError extends BaseError {
  constructor(message, code = ERROR_CODES.API.SERVICE_UNAVAILABLE, metadata = {}, statusCode = 500) {
    // Adjust status code based on error code
    if (code === ERROR_CODES.API.UNAUTHORIZED) statusCode = 401;
    if (code === ERROR_CODES.API.FORBIDDEN) statusCode = 403;
    if (code === ERROR_CODES.VALIDATION.INVALID_CREDENTIALS) statusCode = 401;
    
    super(message, 'SanMarAPIError', statusCode, code, metadata);
  }

  /**
   * Creates an authentication error instance
   * @param {string} message Error message
   * @param {Object} metadata Additional error context
   * @returns {SanMarAPIError}
   */
  static authError(message, metadata = {}) {
    return new SanMarAPIError(
      message,
      ERROR_CODES.API.UNAUTHORIZED,
      metadata,
      401
    );
  }

  /**
   * Creates a WSSecurity error instance
   * @param {string} message Error message
   * @param {Object} metadata Additional error context
   * @returns {SanMarAPIError}
   */
  static wsSecurityError(message, metadata = {}) {
    return new SanMarAPIError(
      message,
      ERROR_CODES.VALIDATION.INVALID_CREDENTIALS,
      {
        ...metadata,
        errorType: 'WSSecurity'
      },
      401
    );
  }

  /**
   * Creates a configuration error instance
   * @param {string} message Error message
   * @param {Object} metadata Additional error context
   * @returns {SanMarAPIError}
   */
  static configError(message, metadata = {}) {
    return new SanMarAPIError(
      message,
      ERROR_CODES.SYSTEM.CONFIGURATION,
      metadata,
      500
    );
  }
}

/**
 * Centralized error handler middleware
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
function handleError(err, req, res, next) {
  // Log error with request context
  const errorContext = {
    url: req.originalUrl,
    method: req.method,
    requestId: req.id, // Assuming request ID middleware
    userId: req.user?.id, // If authentication is used
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  // Handle known error types
  if (err instanceof BaseError) {
    err.logError('API');
    
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        timestamp: err.timestamp,
        ...(process.env.NODE_ENV === 'development' && {
          metadata: err.metadata,
          stack: err.stack
        })
      }
    });
  }

  // Handle unknown errors
  const unknownError = new BaseError(
    'Internal Server Error',
    'UnknownError',
    500,
    'INTERNAL_ERROR',
    { originalError: err.message }
  );
  
  unknownError.logError('API');

  // In production, don't send error details to client
  res.status(500).json({
    error: {
      message: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      timestamp: unknownError.timestamp
    }
  });
}

// Error code constants
const ERROR_CODES = {
  VALIDATION: {
    INVALID_INPUT: 'INVALID_INPUT',
    REQUIRED_FIELD: 'REQUIRED_FIELD',
    INVALID_FORMAT: 'INVALID_FORMAT',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS'
  },
  API: {
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    RATE_LIMITED: 'RATE_LIMITED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
  },
  DATA: {
    NOT_FOUND: 'DATA_NOT_FOUND',
    ALREADY_EXISTS: 'DATA_ALREADY_EXISTS',
    INVALID_STATE: 'INVALID_STATE'
  },
  SYSTEM: {
    CONFIGURATION: 'CONFIGURATION_ERROR',
    DEPENDENCY: 'DEPENDENCY_ERROR',
    NETWORK: 'NETWORK_ERROR',
    WSSECURITY: 'WSSECURITY_ERROR'
  }
};

export {
  BaseError,
  PrintavoAPIError,
  PrintavoValidationError,
  SanMarAPIError,
  handleError,
  ERROR_CODES,
  PrintavoAuthenticationError
};
