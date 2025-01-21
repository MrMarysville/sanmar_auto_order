/**
 * @fileoverview SanMar Service
 * Provides robust integration with SanMar's SOAP API, including
 * comprehensive validation, error handling, and retry logic
 */

import soapClient from './enhancedSoapClient.js';
import { LOG_LEVELS, log } from '../utils/logger.js';
import { SanMarAPIError, ERROR_CODES } from '../utils/errorHandling.js';
import { isCatalogEnabled } from './accountService.js';

/**
 * Validates line items for SanMar API requirements
 * @param {Array} lineItems Items to validate
 * @throws {SanMarAPIError} If validation fails
 * @private
 */
function validateLineItems(lineItems) {
  // Check array structure
  if (!Array.isArray(lineItems)) {
    throw new SanMarAPIError(
      'Line items must be an array',
      ERROR_CODES.VALIDATION.INVALID_FORMAT,
      { received: typeof lineItems }
    );
  }

  // Allow empty array for flexibility
  if (lineItems.length === 0) {
    return;
  }

  // Validate each line item
  lineItems.forEach((item, index) => {
    const errors = [];

    // Required fields
    if (!item.inventoryKey) {
      errors.push('Missing inventoryKey');
    } else if (typeof item.inventoryKey !== 'string') {
      errors.push('inventoryKey must be a string');
    }

    if (!item.quantity) {
      errors.push('Missing quantity');
    } else if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      errors.push('quantity must be a positive integer');
    }

    if (!item.sizeIndex) {
      errors.push('Missing sizeIndex');
    } else if (!Number.isInteger(item.sizeIndex) || item.sizeIndex < 0) {
      errors.push('sizeIndex must be a non-negative integer');
    }

    // Optional fields with type validation
    if (item.warehouse && typeof item.warehouse !== 'string') {
      errors.push('warehouse must be a string when provided');
    }

    if (errors.length > 0) {
      throw new SanMarAPIError(
        'Invalid line item',
        ERROR_CODES.VALIDATION.INVALID_INPUT,
        { 
          itemIndex: index,
          errors: errors
        }
      );
    }
  });
}

/**
 * Validates shipping information
 * @param {Object} shippingInfo Shipping details
 * @throws {SanMarAPIError} If validation fails
 * @private
 */
function validateShippingInfo(shippingInfo) {
  const requiredFields = [
    'shipToName',
    'shipToAddress1',
    'shipToCity',
    'shipToState',
    'shipToZip'
  ];

  const errors = [];

  // Check required fields
  requiredFields.forEach(field => {
    if (!shippingInfo[field]) {
      errors.push(`Missing ${field}`);
    } else if (typeof shippingInfo[field] !== 'string') {
      errors.push(`${field} must be a string`);
    } else if (!shippingInfo[field].trim()) {
      errors.push(`${field} cannot be empty`);
    }
  });

  // Validate ZIP code format
  if (shippingInfo.shipToZip && 
      !/^\d{5}(-\d{4})?$/.test(shippingInfo.shipToZip)) {
    errors.push('Invalid ZIP code format');
  }

  // Validate state code
  if (shippingInfo.shipToState && 
      !/^[A-Z]{2}$/.test(shippingInfo.shipToState)) {
    errors.push('State must be a 2-letter code');
  }

  if (errors.length > 0) {
    throw new SanMarAPIError(
      'Invalid shipping information',
      ERROR_CODES.VALIDATION.INVALID_INPUT,
      { errors }
    );
  }
}

/**
 * Check inventory availability via SanMar's SOAP API
 * @param {Array} lineItems Example: [{ inventoryKey, quantity, sizeIndex, warehouse }]
 * @returns {Promise<Object>} PreSubmit information response
 */
async function getPreSubmitInfo(lineItems = []) {
  log(LOG_LEVELS.INFO, 'SanMarService', {
    action: 'getPreSubmitInfo',
    itemCount: lineItems.length
  });
  
  try {
    // Validate integration access
    const isEnabled = await isCatalogEnabled('sanmar');
    if (!isEnabled) {
      throw new SanMarAPIError(
        'SanMar integration is not enabled for this account',
        ERROR_CODES.API.FORBIDDEN
      );
    }

    // Validate line items (now allows empty arrays)
    validateLineItems(lineItems);
    
    // Handle empty line items case
    if (lineItems.length === 0) {
      return {
        PreSubmitResponse: {
          items: [],
          status: 'SUCCESS',
          message: 'No items to check'
        }
      };
    }

    // Prepare request
    const request = {
      PreSubmitRequest: {
        items: lineItems.map(item => ({
          inventoryKey: item.inventoryKey,
          quantity: item.quantity,
          sizeIndex: item.sizeIndex,
          warehouse: item.warehouse
        }))
      }
    };

    // Execute request with enhanced client
    const result = await soapClient.execute('getPreSubmitInfo', request);

    // Validate response structure
    if (!result.PreSubmitResponse || !Array.isArray(result.PreSubmitResponse.items)) {
      throw new SanMarAPIError(
        'Invalid response structure from SanMar API',
        ERROR_CODES.API.SERVICE_UNAVAILABLE
      );
    }

    return result;
  } catch (error) {
    // Re-throw SanMarAPIError instances
    if (error instanceof SanMarAPIError) {
      throw error;
    }

    // Wrap other errors
    throw new SanMarAPIError(
      'Failed to get inventory information',
      ERROR_CODES.SYSTEM.DEPENDENCY,
      { originalError: error.message }
    );
  }
}

/**
 * Submit purchase order to SanMar
 * @param {Object} orderData Order details including poNumber, shipping info, and lineItems
 * @returns {Promise<Object>} Order submission response
 */
async function submitPO(orderData) {
  log(LOG_LEVELS.INFO, 'SanMarService', {
    action: 'submitPO',
    poNumber: orderData.poNumber,
    itemCount: orderData.lineItems?.length
  });
  
  try {
    // Validate integration access
    const isEnabled = await isCatalogEnabled('sanmar');
    if (!isEnabled) {
      throw new SanMarAPIError(
        'SanMar integration is not enabled for this account',
        ERROR_CODES.API.FORBIDDEN
      );
    }

    // Validate PO number
    if (!orderData.poNumber || typeof orderData.poNumber !== 'string' || 
        !orderData.poNumber.trim()) {
      throw new SanMarAPIError(
        'Invalid purchase order number',
        ERROR_CODES.VALIDATION.INVALID_INPUT
      );
    }

    // Validate line items and shipping info
    validateLineItems(orderData.lineItems);
    validateShippingInfo(orderData);

    // Prevent empty orders
    if (orderData.lineItems.length === 0) {
      throw new SanMarAPIError(
        'Cannot submit empty purchase order',
        ERROR_CODES.VALIDATION.INVALID_INPUT
      );
    }
    
    // Prepare request
    const request = {
      PORequest: {
        header: {
          poNumber: orderData.poNumber,
          shipToName: orderData.shipToName,
          shipToAddress1: orderData.shipToAddress1,
          shipToAddress2: orderData.shipToAddress2 || '',
          shipToCity: orderData.shipToCity,
          shipToState: orderData.shipToState,
          shipToZip: orderData.shipToZip,
          shipToCountry: orderData.shipToCountry || 'USA'
        },
        lineItems: orderData.lineItems.map(item => ({
          inventoryKey: item.inventoryKey,
          quantity: item.quantity,
          sizeIndex: item.sizeIndex,
          warehouse: item.warehouse
        }))
      }
    };

    // Execute request with enhanced client
    const result = await soapClient.execute('submitPO', request);

    // Validate response structure
    if (!result.POResponse || !result.POResponse.confirmationNumber) {
      throw new SanMarAPIError(
        'Invalid response structure from SanMar API',
        ERROR_CODES.API.SERVICE_UNAVAILABLE
      );
    }

    return result;
  } catch (error) {
    // Re-throw SanMarAPIError instances
    if (error instanceof SanMarAPIError) {
      throw error;
    }

    // Wrap other errors
    throw new SanMarAPIError(
      'Failed to submit purchase order',
      ERROR_CODES.SYSTEM.DEPENDENCY,
      { originalError: error.message }
    );
  }
}

/**
 * Get status of a submitted PO
 * @param {string} poNumber Purchase order number
 * @returns {Promise<Object>} PO status and details
 */
async function getPOStatus(poNumber) {
  log(LOG_LEVELS.INFO, 'SanMarService', {
    action: 'getPOStatus',
    poNumber
  });
  
  try {
    // Validate integration access
    const isEnabled = await isCatalogEnabled('sanmar');
    if (!isEnabled) {
      throw new SanMarAPIError(
        'SanMar integration is not enabled for this account',
        ERROR_CODES.API.FORBIDDEN
      );
    }

    // Validate PO number
    if (!poNumber || typeof poNumber !== 'string' || !poNumber.trim()) {
      throw new SanMarAPIError(
        'Invalid purchase order number',
        ERROR_CODES.VALIDATION.INVALID_INPUT
      );
    }
    
    // Prepare request
    const request = {
      POStatusRequest: {
        poNumber: poNumber.trim()
      }
    };

    // Execute request with enhanced client
    const result = await soapClient.execute('getPOStatus', request);

    // Validate response structure
    if (!result.POStatusResponse || !result.POStatusResponse.status) {
      throw new SanMarAPIError(
        'Invalid response structure from SanMar API',
        ERROR_CODES.API.SERVICE_UNAVAILABLE
      );
    }

    return result;
  } catch (error) {
    // Re-throw SanMarAPIError instances
    if (error instanceof SanMarAPIError) {
      throw error;
    }

    // Wrap other errors
    throw new SanMarAPIError(
      'Failed to get PO status',
      ERROR_CODES.SYSTEM.DEPENDENCY,
      { originalError: error.message }
    );
  }
}

export {
  getPreSubmitInfo,
  submitPO,
  getPOStatus
};
