/**
 * @fileoverview Enhanced SOAP Client
 * Provides a robust SOAP client with retry logic, timeout handling,
 * and comprehensive error management
 */

import { soap } from 'strong-soap';
import { loadSanMarConfig } from '../utils/envValidation.js';
import { SanMarAPIError, ERROR_CODES } from '../utils/errorHandling.js';
import { LOG_LEVELS, log } from '../utils/logger.js';

// Configuration constants
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 5000; // 5 seconds
const REQUEST_TIMEOUT = 30000; // 30 seconds

class EnhancedSoapClient {
  constructor() {
    this.client = null;
    this.initialized = false;
    this.config = null;
  }

  /**
   * Initialize the SOAP client with environment validation
   * @private
   * @returns {Promise<void>}
   * @throws {SanMarAPIError} If initialization fails
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load and validate configuration
      this.config = loadSanMarConfig();
      
      // Create SOAP client
      this.client = await this.createSoapClient();
      this.initialized = true;

      log(LOG_LEVELS.INFO, 'SoapClient', {
        action: 'initialize',
        message: 'SOAP client initialized successfully'
      });
    } catch (error) {
      log(LOG_LEVELS.ERROR, 'SoapClient', {
        action: 'initialize',
        status: 'failed',
        error: error.message
      });

      // Re-throw SanMarAPIError instances
      if (error instanceof SanMarAPIError) {
        throw error;
      }

      throw this.classifyError(error);
    }
  }

  /**
   * Create SOAP client with security
   * @private
   * @returns {Promise<Object>} SOAP client instance
   * @throws {SanMarAPIError} If client creation fails
   */
  createSoapClient() {
    return new Promise((resolve, reject) => {
      const options = {
        request: {
          timeout: REQUEST_TIMEOUT
        },
        wsdl_options: {
          timeout: REQUEST_TIMEOUT
        }
      };

      soap.createClient(this.config.wsdlUrl, options, (err, client) => {
        if (err) return reject(err);
        
        try {
          // Add WS-Security
          client.setSecurity(new soap.WSSecurity(
            this.config.username,
            this.config.password,
            { 
              hasTimeStamp: true,
              hasTokenCreated: true
            }
          ));

          resolve(client);
        } catch (error) {
          reject(SanMarAPIError.wsSecurityError(
            'Failed to configure WS-Security',
            { originalError: error.message }
          ));
        }
      });
    });
  }

  /**
   * Classify SOAP errors into specific error types
   * @private
   * @param {Error} error The error to classify
   * @returns {SanMarAPIError} Classified error
   */
  classifyError(error) {
    // WS-Security errors
    if (error.message?.includes('Invalid security token') ||
        error.message?.includes('Security header') ||
        error.message?.includes('WSSecurity')) {
      return SanMarAPIError.wsSecurityError(
        'WS-Security authentication failed',
        { originalError: error.message }
      );
    }

    // Authentication errors
    if (error.message?.includes('Authentication failed') || 
        error.message?.includes('Invalid credentials')) {
      return SanMarAPIError.authError(
        'Authentication failed',
        { originalError: error.message }
      );
    }

    // Timeout errors
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return new SanMarAPIError(
        'Request timed out',
        ERROR_CODES.SYSTEM.NETWORK,
        { originalError: error.message }
      );
    }

    // WSDL parsing errors
    if (error.message?.includes('WSDL')) {
      return SanMarAPIError.configError(
        'WSDL configuration error',
        { originalError: error.message }
      );
    }

    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new SanMarAPIError(
        'Network connection error',
        ERROR_CODES.SYSTEM.NETWORK,
        { originalError: error.message }
      );
    }

    // Default to generic API error
    return new SanMarAPIError(
      error.message || 'Unknown SanMar API error',
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
    // Never retry authentication or WS-Security errors
    if (error instanceof SanMarAPIError) {
      if (error.code === ERROR_CODES.API.UNAUTHORIZED ||
          error.code === ERROR_CODES.VALIDATION.INVALID_CREDENTIALS) {
        return false;
      }
    }

    // Timeout errors are retryable
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return true;
    }

    // Network errors are retryable
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return true;
    }

    // Service errors are retryable
    if (error.message?.includes('Service Unavailable') ||
        error.message?.includes('Internal Server Error')) {
      return true;
    }

    return false;
  }

  /**
   * Execute a SOAP method with retry logic
   * @param {string} method SOAP method name
   * @param {Object} args Method arguments
   * @returns {Promise<Object>} Method result
   * @throws {SanMarAPIError} On non-retryable errors or max retries exceeded
   */
  async execute(method, args) {
    await this.initialize();

    let lastError = null;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await new Promise((resolve, reject) => {
          this.client[method](args, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
        });

        // Validate response structure
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid response structure');
        }

        // Check for empty array edge case
        if (Array.isArray(result) && result.length === 0) {
          return { items: [] }; // Return standardized empty response
        }

        return result;
      } catch (error) {
        lastError = error;
        
        // Classify the error
        const classifiedError = this.classifyError(error);

        // Don't retry if error is not retryable
        if (!this.isRetryableError(classifiedError)) {
          throw classifiedError;
        }

        // If we've exhausted retries, throw the error
        if (attempt === MAX_RETRIES) {
          throw classifiedError;
        }

        // Log retry attempt
        log(LOG_LEVELS.WARN, 'SoapClient', {
          action: 'retry',
          method,
          attempt: attempt + 1,
          error: error.message
        });

        // Wait before retrying
        const delay = this.calculateBackoff(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Re-initialize client on retry
        this.initialized = false;
        await this.initialize();
      }
    }

    // This shouldn't be reached due to the throw in the loop
    throw this.classifyError(lastError);
  }
}

// Export singleton instance
const client = new EnhancedSoapClient();
export default client;
