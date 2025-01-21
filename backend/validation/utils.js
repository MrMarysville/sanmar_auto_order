const { 
  invoiceInputSchema, 
  searchCriteriaSchema 
} = require('./schemas');

const LOG_LEVELS = require('../utils/logger').LOG_LEVELS;
const log = require('../utils/logger').log;
const { PrintavoValidationError, ERROR_CODES } = require('../utils/errorHandling');

const SERVICE_NAME = 'ValidationService';

/**
 * Validates a zip code format
 * @param {string} zipCode - The zip code to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateZipCode(zipCode) {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
}

/**
 * Validates a price value
 * @param {number} price - The price to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validatePrice(price) {
  return typeof price === 'number' && price >= 0;
}

/**
 * Validates a quantity value
 * @param {number} quantity - The quantity to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateQuantity(quantity) {
  return Number.isInteger(quantity) && quantity > 0;
}

/**
 * Validates a status ID format
 * @param {string} statusId - The status ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateStatusId(statusId) {
  return typeof statusId === 'string' && statusId.length > 0;
}

/**
 * Validates a string against a regex pattern
 * @param {string} value - The value to validate
 * @param {RegExp} pattern - The pattern to validate against
 * @returns {boolean} True if valid, false otherwise
 */
function validateWithRegex(value, pattern) {
  return pattern.test(value);
}

/**
 * Validates if a string is a valid date
 * @param {string} dateStr - The date string to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidDate(dateStr) {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validates invoice input data
 * @param {Object} invoiceData - The invoice data to validate
 * @throws {PrintavoValidationError} If validation fails
 */
function validateInvoiceInput(invoiceData) {
  try {
    log(LOG_LEVELS.DEBUG, 'Validating invoice input data');
    const validatedData = invoiceInputSchema.parse(invoiceData);

    // Additional custom validations
    if (validatedData.shippingAddress?.zipCode && !validateZipCode(validatedData.shippingAddress.zipCode)) {
      throw new PrintavoValidationError(
        'Invalid zip code format',
        { field: 'shippingAddress.zipCode' },
        { code: ERROR_CODES.VALIDATION.INVALID_FORMAT }
      );
    }

    validatedData.lineItems.forEach((item, index) => {
      if (item.price && !validatePrice(item.price)) {
        throw new PrintavoValidationError(
          `Invalid price for line item ${index}`,
          { field: `lineItems[${index}].price` },
          { code: ERROR_CODES.VALIDATION.INVALID_FORMAT }
        );
      }
      if (!validateQuantity(item.quantity)) {
        throw new PrintavoValidationError(
          `Invalid quantity for line item ${index}`,
          { field: `lineItems[${index}].quantity` },
          { code: ERROR_CODES.VALIDATION.INVALID_FORMAT }
        );
      }
    });

    log(LOG_LEVELS.DEBUG, SERVICE_NAME, {
      action: 'validateInvoiceInput',
      status: 'success'
    });
  } catch (error) {
    log(LOG_LEVELS.ERROR, SERVICE_NAME, {
      action: 'validateInvoiceInput',
      status: 'failed',
      error: error.message,
      stack: error.stack
    });
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
    throw new PrintavoValidationError(
      'Invalid invoice data',
      error.errors || [{ message: error.message }],
      { 
        code: ERROR_CODES.VALIDATION.INVALID_INPUT,
        originalError: error.message 
      }
    );
  }
}

/**
 * Validates quote input data
 * @param {Object} quoteData - The quote data to validate
 * @throws {PrintavoValidationError} If validation fails
 */
function validateQuoteInput(quoteData) {
  try {
    log(LOG_LEVELS.DEBUG, 'Validating quote input data');

    // Required fields - either contactId or contact lookup info
    if (!quoteData.contactId && !quoteData.contact) {
      throw new PrintavoValidationError(
        'Either contactId or contact information (email/name) is required',
        { field: 'contact' },
        { code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
      );
    }

    // If contact info provided instead of ID, validate it
    if (quoteData.contact) {
      if (!quoteData.contact.email && !quoteData.contact.fullName) {
        throw new PrintavoValidationError(
          'Either email or full name is required for contact lookup',
          { field: 'contact' },
          { code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
        );
      }
      // Validate email format if provided
      if (quoteData.contact.email && !validateWithRegex(quoteData.contact.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new PrintavoValidationError(
          'Invalid email format',
          { field: 'contact.email' },
          { code: ERROR_CODES.VALIDATION.INVALID_FORMAT }
        );
      }
    }

    if (!quoteData.lineItems || !Array.isArray(quoteData.lineItems) || quoteData.lineItems.length === 0) {
      throw new PrintavoValidationError(
        'At least one line item is required',
        { field: 'lineItems' },
        { code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
      );
    }

    // Validate each line item
    quoteData.lineItems.forEach((item, index) => {
      if (!item.productId) {
        throw new PrintavoValidationError(
          `Product ID is required for line item ${index}`,
          { field: `lineItems[${index}].productId` },
          { code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
        );
      }
      if (!validateQuantity(item.quantity)) {
        throw new PrintavoValidationError(`Invalid quantity for line item ${index}`);
      }
      if (!item.size) {
        throw new PrintavoValidationError(
          `Size is required for line item ${index}`,
          { field: `lineItems[${index}].size` },
          { code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
        );
      }
      if (!item.color) {
        throw new PrintavoValidationError(
          `Color is required for line item ${index}`,
          { field: `lineItems[${index}].color` },
          { code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
        );
      }
      if (item.price && !validatePrice(item.price)) {
        throw new PrintavoValidationError(
          `Invalid price for line item ${index}`,
          { field: `lineItems[${index}].price` },
          { code: ERROR_CODES.VALIDATION.INVALID_FORMAT }
        );
      }
    });

    // Validate addresses if provided
    if (quoteData.shippingAddress) {
      if (!quoteData.shippingAddress.customerName) {
        throw new PrintavoValidationError(
          'Customer name is required for shipping address',
          { field: 'shippingAddress.customerName' },
          { code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
        );
      }
      if (!quoteData.shippingAddress.address1) {
        throw new PrintavoValidationError(
          'Address line 1 is required for shipping address',
          { field: 'shippingAddress.address1' },
          { code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
        );
      }
      if (!quoteData.shippingAddress.city) {
        throw new PrintavoValidationError(
          'City is required for shipping address',
          { field: 'shippingAddress.city' },
          { code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
        );
      }
      if (!quoteData.shippingAddress.stateIso) {
        throw new PrintavoValidationError(
          'State is required for shipping address',
          { field: 'shippingAddress.stateIso' },
          { code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
        );
      }
      if (!quoteData.shippingAddress.zipCode) {
        throw new PrintavoValidationError(
          'Zip code is required for shipping address',
          { field: 'shippingAddress.zipCode' },
          { code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
        );
      }
      if (quoteData.shippingAddress.zipCode && !validateZipCode(quoteData.shippingAddress.zipCode)) {
        throw new PrintavoValidationError(
          'Invalid zip code format for shipping address',
          { field: 'shippingAddress.zipCode' },
          { code: ERROR_CODES.VALIDATION.INVALID_FORMAT }
        );
      }
    }

    // Validate due date if provided
    if (quoteData.dueDate && !isValidDate(quoteData.dueDate)) {
      throw new PrintavoValidationError(
        'Invalid due date format',
        { field: 'dueDate' },
        { code: ERROR_CODES.VALIDATION.INVALID_FORMAT }
      );
    }

    // Validate status ID if provided
    if (quoteData.statusId && !validateStatusId(quoteData.statusId)) {
      throw new PrintavoValidationError(
        'Invalid status ID',
        { field: 'statusId' },
        { code: ERROR_CODES.VALIDATION.INVALID_FORMAT }
      );
    }

    log(LOG_LEVELS.DEBUG, SERVICE_NAME, {
      action: 'validateQuoteInput',
      status: 'success'
    });
  } catch (error) {
    log(LOG_LEVELS.ERROR, SERVICE_NAME, {
      action: 'validateQuoteInput',
      status: 'failed',
      error: error.message,
      stack: error.stack
    });
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
    throw new PrintavoValidationError(
      'Invalid quote data',
      error.errors || [{ message: error.message }],
      { 
        code: ERROR_CODES.VALIDATION.INVALID_INPUT,
        originalError: error.message 
      }
    );
  }
}

/**
 * Validates search criteria
 * @param {Object} criteria - The search criteria to validate
 * @throws {PrintavoValidationError} If validation fails
 */
function validateSearchCriteria(criteria) {
  try {
    log(LOG_LEVELS.DEBUG, 'Validating search criteria');
    const validatedData = searchCriteriaSchema.parse(criteria);

    // Additional custom validations
    if (validatedData.statusIds?.some(id => !validateStatusId(id))) {
      throw new PrintavoValidationError(
        'Invalid status ID format',
        { field: 'statusIds' },
        { code: ERROR_CODES.VALIDATION.INVALID_FORMAT }
      );
    }

    if (validatedData.dateRange) {
      if (!isValidDate(validatedData.dateRange.start)) {
        throw new PrintavoValidationError(
          'Invalid start date',
          { field: 'dateRange.start' },
          { code: ERROR_CODES.VALIDATION.INVALID_FORMAT }
        );
      }
      if (!isValidDate(validatedData.dateRange.end)) {
        throw new PrintavoValidationError(
          'Invalid end date',
          { field: 'dateRange.end' },
          { code: ERROR_CODES.VALIDATION.INVALID_FORMAT }
        );
      }
    }

    log(LOG_LEVELS.DEBUG, SERVICE_NAME, {
      action: 'validateSearchCriteria',
      status: 'success'
    });
  } catch (error) {
    log(LOG_LEVELS.ERROR, SERVICE_NAME, {
      action: 'validateSearchCriteria',
      status: 'failed',
      error: error.message,
      stack: error.stack
    });
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
    throw new PrintavoValidationError(
      'Invalid search criteria',
      error.errors || [{ message: error.message }],
      { 
        code: ERROR_CODES.VALIDATION.INVALID_INPUT,
        originalError: error.message 
      }
    );
  }
}

module.exports = {
  validateZipCode,
  validatePrice,
  validateQuantity,
  validateStatusId,
  validateWithRegex,
  isValidDate,
  validateInvoiceInput,
  validateQuoteInput,
  validateSearchCriteria
};
