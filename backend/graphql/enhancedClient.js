/**
 * @fileoverview Enhanced GraphQL Client
 * Provides a robust GraphQL client with retry logic, timeout handling,
 * and comprehensive error management
 */

const { GraphQLClient } = require('graphql-request');
const { validatePrintavoEnv } = require('../utils/envValidation');
const { 
  PrintavoAPIError, 
  PrintavoValidationError,
  PrintavoAuthenticationError,
  ERROR_CODES 
} = require('../utils/errorHandling');
const { LOG_LEVELS, log } = require('../utils/logger');

// Configuration constants
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 5000; // 5 seconds
const REQUEST_TIMEOUT = 30000; // 30 seconds

class EnhancedGraphQLClient {
  constructor() {
    this.client = null;
    this.initializeClient();
  }

  /**
   * Initialize the GraphQL client with environment validation
   * @private
   */
  initializeClient() {
    try {
      // Validate environment variables
      validatePrintavoEnv();

      this.client = new GraphQLClient(process.env.PRINTAVO_API_URL, {
        headers: {
          Authorization: `Bearer ${process.env.PRINTAVO_ACCESS_TOKEN}`,
          'X-Printavo-Email': process.env.PRINTAVO_EMAIL
        },
        timeout: REQUEST_TIMEOUT
      });

      log(LOG_LEVELS.INFO, 'GraphQLClient', {
        action: 'initialize',
        message: 'GraphQL client initialized successfully'
      });
    } catch (error) {
      log(LOG_LEVELS.ERROR, 'GraphQLClient', {
        action: 'initialize',
        status: 'failed',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Classify GraphQL errors into specific error types
   * @private
   * @param {Error} error The error to classify
   * @returns {Error} Classified error
   */
  classifyError(error) {
    // Network or timeout errors
    if (error.type === 'system') {
      return new PrintavoAPIError(
        'Network or system error occurred',
        ERROR_CODES.SYSTEM.NETWORK,
        { originalError: error.message }
      );
    }

    // Authentication errors
    if (error.response?.errors?.some(e => e.extensions?.code === 'UNAUTHENTICATED')) {
      return new PrintavoAuthenticationError(
        'Authentication failed',
        ERROR_CODES.API.UNAUTHORIZED,
        { originalError: error.message }
      );
    }

    // Validation errors
    if (error.response?.errors?.some(e => e.extensions?.code === 'BAD_USER_INPUT')) {
      return new PrintavoValidationError(
        'Invalid input data',
        error.response.errors.map(e => ({
          message: e.message,
          path: e.path
        }))
      );
    }

    // Rate limiting
    if (error.response?.errors?.some(e => e.extensions?.code === 'RATE_LIMITED')) {
      return new PrintavoAPIError(
        'Rate limit exceeded',
        ERROR_CODES.API.RATE_LIMITED,
        { originalError: error.message }
      );
    }

    // Default to generic API error
    return new PrintavoAPIError(
      error.message,
      ERROR_CODES.API.SERVICE_UNAVAILABLE,
      { originalError: error.message }
    );
  }

  /**
   * Calculate exponential backoff delay
   * @private
   * @param {number} retryCount Current retry attempt
   * @returns {number} Delay in milliseconds
   */
  calculateBackoff(retryCount) {
    const delay = Math.min(
      INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
      MAX_RETRY_DELAY
    );
    return delay + Math.random() * 1000; // Add jitter
  }

  /**
   * Check if error is retryable
   * @private
   * @param {Error} error The error to check
   * @returns {boolean} Whether the error is retryable
   */
  isRetryableError(error) {
    // Network errors are retryable
    if (error.type === 'system') return true;

    // Rate limiting errors are retryable
    if (error.response?.errors?.some(e => e.extensions?.code === 'RATE_LIMITED')) {
      return true;
    }

    // Service unavailable errors are retryable
    if (error.response?.errors?.some(e => 
      e.extensions?.code === 'SERVICE_UNAVAILABLE' ||
      e.extensions?.code === 'INTERNAL_SERVER_ERROR'
    )) {
      return true;
    }

    return false;
  }

  /**
   * Execute a GraphQL request with retry logic
   * @param {string} query GraphQL query or mutation
   * @param {Object} variables Query variables
   * @returns {Promise<Object>} Query result
   * @throws {PrintavoAPIError} On non-retryable errors or max retries exceeded
   */
  async request(query, variables = {}) {
    let lastError = null;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await this.client.request(query, variables);
        return result;
      } catch (error) {
        lastError = error;
        
        // Don't retry if error is not retryable
        if (!this.isRetryableError(error)) {
          throw this.classifyError(error);
        }

        // If we've exhausted retries, throw the error
        if (attempt === MAX_RETRIES) {
          throw this.classifyError(error);
        }

        // Log retry attempt
        log(LOG_LEVELS.WARN, 'GraphQLClient', {
          action: 'retry',
          attempt: attempt + 1,
          error: error.message
        });

        // Wait before retrying
        const delay = this.calculateBackoff(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This shouldn't be reached due to the throw in the loop
    throw this.classifyError(lastError);
  }
}

// Export singleton instance
const client = new EnhancedGraphQLClient();
module.exports = client;
