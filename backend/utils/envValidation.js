/**
 * @fileoverview Environment Variable Validation Utility
 * Provides robust validation and parsing of environment variables
 */

import { PrintavoValidationError, SanMarAPIError, ERROR_CODES } from './errorHandling.js';

/**
 * Validates required environment variables
 * @param {string[]} requiredVars Array of required environment variable names
 * @param {string} context Service context for error messages
 * @throws {PrintavoValidationError|SanMarAPIError} If any required variables are missing
 */
function validateRequiredEnvVars(requiredVars, context) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    const ErrorClass = context === 'SanMar' ? SanMarAPIError : PrintavoValidationError;
    const errorCode = context === 'SanMar' ? ERROR_CODES.SYSTEM.CONFIGURATION : 'ENV_VALIDATION_ERROR';
    
    throw new ErrorClass(
      `Missing required environment variables for ${context}: ${missing.join(', ')}`,
      errorCode,
      { missingVars: missing }
    );
  }
}

/**
 * Validates URL format
 * @param {string} url URL to validate
 * @param {string} varName Environment variable name for error context
 * @param {string} context Service context for error messages
 * @throws {PrintavoValidationError|SanMarAPIError} If URL is invalid
 */
function validateUrlFormat(url, varName, context) {
  try {
    new URL(url);
  } catch (error) {
    const ErrorClass = context === 'SanMar' ? SanMarAPIError : PrintavoValidationError;
    const errorCode = context === 'SanMar' ? ERROR_CODES.VALIDATION.INVALID_FORMAT : 'ENV_VALIDATION_ERROR';
    
    throw new ErrorClass(
      `Invalid ${varName} format`,
      errorCode,
      { variable: varName, value: url }
    );
  }
}

/**
 * Validates Printavo environment configuration
 * @throws {PrintavoValidationError} If validation fails
 */
function validatePrintavoEnv() {
  const requiredVars = [
    'PRINTAVO_API_URL',
    'PRINTAVO_ACCESS_TOKEN',
    'PRINTAVO_EMAIL'
  ];

  validateRequiredEnvVars(requiredVars, 'Printavo');

  // Validate URL format
  validateUrlFormat(process.env.PRINTAVO_API_URL, 'PRINTAVO_API_URL', 'Printavo');

  // Validate token format (basic format check)
  if (!/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(process.env.PRINTAVO_ACCESS_TOKEN)) {
    throw new PrintavoValidationError(
      'Invalid PRINTAVO_ACCESS_TOKEN format',
      'ENV_VALIDATION_ERROR',
      { variable: 'PRINTAVO_ACCESS_TOKEN' }
    );
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.PRINTAVO_EMAIL)) {
    throw new PrintavoValidationError(
      'Invalid PRINTAVO_EMAIL format',
      'ENV_VALIDATION_ERROR',
      { variable: 'PRINTAVO_EMAIL' }
    );
  }
}

/**
 * Validates SanMar environment configuration
 * @throws {SanMarAPIError} If validation fails
 */
function validateSanMarEnv() {
  const requiredVars = [
    'SANMAR_WSDL_URL',
    'SANMAR_USERNAME',
    'SANMAR_PASSWORD'
  ];

  validateRequiredEnvVars(requiredVars, 'SanMar');

  // Validate WSDL URL format
  validateUrlFormat(process.env.SANMAR_WSDL_URL, 'SANMAR_WSDL_URL', 'SanMar');

  // Validate username format and content
  const username = process.env.SANMAR_USERNAME.trim();
  if (!username) {
    throw SanMarAPIError.configError(
      'SANMAR_USERNAME cannot be empty',
      { variable: 'SANMAR_USERNAME' }
    );
  }
  
  // Additional username validation (if required by SanMar)
  if (!/^[A-Za-z0-9_-]+$/.test(username)) {
    throw SanMarAPIError.configError(
      'SANMAR_USERNAME contains invalid characters',
      { 
        variable: 'SANMAR_USERNAME',
        details: 'Username must contain only letters, numbers, underscores, and hyphens'
      }
    );
  }

  // Validate password requirements
  const password = process.env.SANMAR_PASSWORD;
  if (password.length < 8) {
    throw SanMarAPIError.configError(
      'SANMAR_PASSWORD must be at least 8 characters',
      { 
        variable: 'SANMAR_PASSWORD',
        details: 'Minimum length requirement not met'
      }
    );
  }

  // Additional password strength validation
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\W_]{8,}$/.test(password)) {
    throw SanMarAPIError.configError(
      'SANMAR_PASSWORD does not meet complexity requirements',
      { 
        variable: 'SANMAR_PASSWORD',
        details: 'Password must contain at least one letter and one number'
      }
    );
  }
}

/**
 * Loads and validates all required environment variables
 * @returns {Object} Validated environment variables
 * @throws {SanMarAPIError} If validation fails
 */
function loadSanMarConfig() {
  validateSanMarEnv();

  return {
    wsdlUrl: process.env.SANMAR_WSDL_URL,
    username: process.env.SANMAR_USERNAME.trim(),
    password: process.env.SANMAR_PASSWORD
  };
}

export {
  validatePrintavoEnv,
  validateSanMarEnv,
  validateRequiredEnvVars,
  loadSanMarConfig
};
