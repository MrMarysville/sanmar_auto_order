const { LOG_LEVELS, log } = require('../utils/logger');
const { executeGraphQL, clientPromise } = require('../graphql/client');
const { PrintavoAPIError, PrintavoValidationError, ERROR_CODES } = require('../utils/errorHandling');
const InventoryMapping = require('../models/InventoryMapping');
const { GET_LINE_ITEM } = require('../graphql/queries/lineItem');
const { CREATE_LINE_ITEM, UPDATE_LINE_ITEM, DELETE_LINE_ITEM } = require('../graphql/mutations/lineItem');

// Constants
const SERVICE_NAME = 'LineItemService';

const REGEX_PATTERNS = {
  QUANTITY: /qty:?\s*(\d+)|quantity:?\s*(\d+)|(\d+)\s*pc?s?/i,
  SIZE: /size:?\s*([xsml\d]+)/i,
  COLOR: /colou?r:?\s*(\w+)/i
};

/**
 * Get a line item by ID
 * @param {string} id - Line item ID
 * @returns {Promise<import('../graphql/queries/lineItem').LineItemFragment>} Line item data
 * @throws {PrintavoAPIError} When line item is not found or fetch fails
 */
async function getLineItem(id) {
  log(LOG_LEVELS.INFO, SERVICE_NAME, { 
    action: 'getLineItem',
    id 
  });
  
  try {
    await clientPromise;
    
    const data = await executeGraphQL(GET_LINE_ITEM, { id });
    if (!data?.lineItem) {
      throw new PrintavoAPIError(
        'Line item not found',
        ERROR_CODES.DATA.NOT_FOUND,
        { 
          action: 'getLineItem',
          id 
        }
      );
    }
    return data.lineItem;
  } catch (error) {
    if (error instanceof PrintavoAPIError) {
      throw error;
    }
      throw new PrintavoAPIError(
        'Failed to fetch line item',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'getLineItem',
          id,
          originalError: error.message 
        }
      );
  }
}

/**
 * Validate line item input data
 * @param {import('../graphql/mutations/lineItem').LineItemCreateInput} lineItemData 
 * @throws {PrintavoValidationError} When validation fails
 */
function validateLineItemInput(lineItemData) {
  if (!lineItemData.product?.id) {
    throw new PrintavoValidationError(
      'Product ID is required',
      { field: 'product.id' },
      { code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
    );
  }
  if (!lineItemData.quantity || lineItemData.quantity < 1) {
    throw new PrintavoValidationError(
      'Quantity must be greater than 0',
      { field: 'quantity' },
      { code: ERROR_CODES.VALIDATION.INVALID_FORMAT }
    );
  }
}

/**
 * Create a new line item
 * @param {import('../graphql/mutations/lineItem').LineItemCreateInput} lineItemData - Line item creation data
 * @returns {Promise<import('../graphql/queries/lineItem').LineItemFragment>} Created line item
 * @throws {PrintavoValidationError} When input validation fails
 * @throws {PrintavoAPIError} When creation fails
 */
async function createLineItem(lineItemData) {
  log(LOG_LEVELS.INFO, SERVICE_NAME, { 
    action: 'createLineItem',
    productId: lineItemData.product?.id,
    quantity: lineItemData.quantity
  });
  
  try {
    validateLineItemInput(lineItemData);
    await clientPromise;
    
    const data = await executeGraphQL(CREATE_LINE_ITEM, {
      input: {
        product: { id: lineItemData.product.id },
        quantity: lineItemData.quantity,
        size: lineItemData.size,
        color: lineItemData.color,
        price: lineItemData.price,
        cost: lineItemData.cost,
        markup: lineItemData.markup,
        imprints: lineItemData.imprints?.map(imp => ({
          name: imp.name,
          description: imp.description,
          location: imp.location,
          colors: imp.colors
        }))
      }
    });
    
    const response = data?.lineItemCreate;
    if (!response) {
      throw new PrintavoAPIError(
        'No response from create mutation',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'createLineItem',
          productId: lineItemData.product?.id 
        }
      );
    }
    
    if (response.errors?.length > 0) {
      throw new PrintavoValidationError(
        'Line item creation failed',
        response.errors,
        { 
          action: 'createLineItem',
          productId: lineItemData.product?.id 
        }
      );
    }
    
    return response.lineItem;
  } catch (error) {
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
      throw new PrintavoAPIError(
        'Failed to create line item',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'createLineItem',
          productId: lineItemData.product?.id,
          originalError: error.message 
        }
      );
  }
}

/**
 * Update a line item
 * @param {string} id - Line item ID
 * @param {Object} updateData - Update data following LineItemUpdateInput schema
 * @returns {Promise<import('../graphql/queries/lineItem').LineItemFragment>} Updated line item
 * @throws {PrintavoValidationError} When update validation fails
 * @throws {PrintavoAPIError} When update fails
 */
async function updateLineItem(id, updateData) {
  log(LOG_LEVELS.INFO, SERVICE_NAME, { 
    action: 'updateLineItem',
    id,
    updateFields: Object.keys(updateData)
  });
  
  try {
    await clientPromise;
    
    const data = await executeGraphQL(UPDATE_LINE_ITEM, {
      id,
      input: updateData
    });
    
    const response = data?.lineItemUpdate;
    if (!response) {
      throw new PrintavoAPIError(
        'No response from update mutation',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'updateLineItem',
          id 
        }
      );
    }
    
    if (response.errors?.length > 0) {
      throw new PrintavoValidationError(
        'Line item update failed',
        response.errors,
        { 
          action: 'updateLineItem',
          id 
        }
      );
    }
    
    return response.lineItem;
  } catch (error) {
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
      throw new PrintavoAPIError(
        'Failed to update line item',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'updateLineItem',
          id,
          originalError: error.message 
        }
      );
  }
}

/**
 * Delete a line item
 * @param {string} id - Line item ID
 * @returns {Promise<boolean>} Success status
 * @throws {PrintavoValidationError} When deletion validation fails
 * @throws {PrintavoAPIError} When deletion fails
 */
async function deleteLineItem(id) {
  log(LOG_LEVELS.INFO, SERVICE_NAME, { 
    action: 'deleteLineItem',
    id 
  });
  
  try {
    await clientPromise;
    
    const data = await executeGraphQL(DELETE_LINE_ITEM, { id });
    
    const response = data?.lineItemDelete;
    if (!response) {
      throw new PrintavoAPIError(
        'No response from delete mutation',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'deleteLineItem',
          id 
        }
      );
    }
    
    if (response.errors?.length > 0) {
      throw new PrintavoValidationError(
        'Line item deletion failed',
        response.errors,
        { 
          action: 'deleteLineItem',
          id 
        }
      );
    }
    
    return response.success;
  } catch (error) {
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
      throw new PrintavoAPIError(
        'Failed to delete line item',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'deleteLineItem',
          id,
          originalError: error.message 
        }
      );
  }
}

/**
 * Extract line item information from a text line
 * @param {string} line - Text line to parse
 * @param {Object} currentItem - Current line item being built
 * @returns {Object} Updated line item data
 */
function parseLineItemInfo(line, currentItem) {
  if (!currentItem) return null;

  // Look for quantity
  const quantityMatch = line.match(REGEX_PATTERNS.QUANTITY);
  if (quantityMatch) {
    const qty = parseInt(quantityMatch[1] || quantityMatch[2] || quantityMatch[3]);
    if (!isNaN(qty)) {
      currentItem.quantity = qty;
    }
    return currentItem;
  }
  
  // Look for size
  const sizeMatch = line.match(REGEX_PATTERNS.SIZE);
  if (sizeMatch) {
    currentItem.size = sizeMatch[1].toUpperCase();
    return currentItem;
  }
  
  // Look for color
  const colorMatch = line.match(REGEX_PATTERNS.COLOR);
  if (colorMatch) {
    currentItem.color = colorMatch[1];
    return currentItem;
  }

  return currentItem;
}

/**
 * Parse line items from OCR text using inventory mappings
 * @param {string} text - The OCR extracted text to parse
 * @returns {Promise<Array<Object>>} Array of parsed line items
 * @throws {PrintavoValidationError} When parsing fails or no valid items found
 */
async function parseLineItems(text) {
  log(LOG_LEVELS.INFO, SERVICE_NAME, {
    action: 'parseLineItems',
    textLength: text.length
  });
  
  try {
    const mappings = await InventoryMapping.find({}).lean();
    if (!mappings?.length) {
      throw new PrintavoValidationError(
        'No inventory mappings found',
        [{ message: 'Please run the seed script to populate inventory mappings' }],
        { 
          code: ERROR_CODES.DATA.NOT_FOUND,
          action: 'parseLineItems'
        }
      );
    }
    
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
      
    const lineItems = [];
    let currentItem = null;
    
    for (const line of lines) {
      // Try to match line against inventory mappings
      const matchedMapping = mappings.find(mapping => 
        line.toLowerCase().includes(mapping.sanmarCode.toLowerCase()) ||
        line.toLowerCase().includes(mapping.description.toLowerCase())
      );
      
      if (matchedMapping) {
        if (currentItem) {
          lineItems.push(currentItem);
        }
        currentItem = {
          product: { id: matchedMapping.productId },
          quantity: 0,
          size: null,
          color: null,
          price: 0
        };
        continue;
      }
      
      currentItem = parseLineItemInfo(line, currentItem);
    }
    
    // Add final item if exists
    if (currentItem) {
      lineItems.push(currentItem);
    }
    
    // Validate extracted items
    const validItems = lineItems.filter(item => 
      item.product?.id && 
      item.quantity > 0 &&
      item.size
    );
    
    log(LOG_LEVELS.INFO, SERVICE_NAME, {
      action: 'parseLineItems',
      status: 'success',
      totalFound: lineItems.length,
      validItems: validItems.length
    });
    
    if (!validItems.length) {
      throw new PrintavoValidationError(
        'No valid line items found in text',
        [{ message: `Found ${lineItems.length} items but none were valid` }],
        { 
          code: ERROR_CODES.VALIDATION.INVALID_INPUT,
          action: 'parseLineItems',
          totalFound: lineItems.length 
        }
      );
    }
    
    return validItems;
    
  } catch (error) {
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
      throw new PrintavoValidationError(
        'Failed to parse line items',
        [{ message: error.message }],
        { 
          code: ERROR_CODES.VALIDATION.INVALID_INPUT,
          action: 'parseLineItems',
          originalError: error.message 
        }
      );
  }
}

module.exports = {
  getLineItem,
  createLineItem,
  updateLineItem,
  deleteLineItem,
  parseLineItems,
  // Export constants for testing
  REGEX_PATTERNS
};
