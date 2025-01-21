const { LOG_LEVELS, log } = require('../utils/logger');
const { executeGraphQL, clientPromise } = require('../graphql/client');
const { validateInvoiceInput } = require('../validation/utils');
const { PrintavoAPIError, PrintavoValidationError, ERROR_CODES } = require('../utils/errorHandling');
const { GET_INVOICE, GET_RECENT_INVOICES } = require('../graphql/queries/invoice');
const { CREATE_INVOICE, UPDATE_INVOICE, DELETE_INVOICE } = require('../graphql/mutations/invoice');

// Constants
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_SORT_FIELD = 'CREATED_AT';
const DEFAULT_SORT_DIRECTION = true; // descending
const DEFAULT_DUE_DATE_DAYS = 7;

const SERVICE_NAME = 'InvoiceService';

/**
 * Fetch an invoice by ID
 * @param {string} invoiceId - The invoice ID
 * @returns {Promise<Object>} The invoice data
 * @throws {PrintavoAPIError} When invoice is not found or fetch fails
 */
async function getInvoice(invoiceId) {
  log(LOG_LEVELS.INFO, SERVICE_NAME, { 
    action: 'getInvoice',
    invoiceId 
  });
  
  try {
    await clientPromise;
    
    const data = await executeGraphQL(GET_INVOICE, { id: invoiceId });
    if (!data?.invoice) {
      throw new PrintavoAPIError(
        'Invoice not found',
        ERROR_CODES.DATA.NOT_FOUND,
        { 
          action: 'getInvoice',
          id: invoiceId 
        }
      );
    }
    return data.invoice;
  } catch (error) {
    if (error instanceof PrintavoAPIError) {
      throw error;
    }
      throw new PrintavoAPIError(
        'Failed to fetch invoice',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'getInvoice',
          id: invoiceId,
          originalError: error.message 
        }
      );
  }
}

/**
 * Fetch recent invoices with pagination and sorting
 * @param {import('../graphql/queries/invoice').InvoiceQueryOptions} options - Query options
 * @returns {Promise<Object>} The invoices data with pagination info
 * @throws {PrintavoAPIError} When fetch fails
 */
async function getRecentInvoices(options = {}) {
  const {
    first = DEFAULT_PAGE_SIZE,
    after = null,
    statusIds = null,
    inProductionAfter = null,
    inProductionBefore = null,
    paymentStatus = null,
    sortOn = DEFAULT_SORT_FIELD,
    sortDescending = DEFAULT_SORT_DIRECTION,
    searchTerm = null,
    tags = null
  } = options;

  log(LOG_LEVELS.INFO, SERVICE_NAME, {
    action: 'getRecentInvoices',
    first,
    after,
    statusIds,
    paymentStatus,
    sortOn
  });

  try {
    await clientPromise;
    
    const data = await executeGraphQL(GET_RECENT_INVOICES, {
      first: Math.min(first, DEFAULT_PAGE_SIZE),
      after,
      statusIds,
      inProductionAfter,
      inProductionBefore,
      paymentStatus,
      sortOn,
      sortDescending,
      searchTerm,
      tags
    });

    if (!data?.invoices) {
      throw new PrintavoAPIError(
        'No invoices data returned',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { action: 'getRecentInvoices' }
      );
    }

    return data.invoices;
  } catch (error) {
      throw new PrintavoAPIError(
        'Failed to fetch recent invoices',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'getRecentInvoices',
          originalError: error.message,
          options: { first, statusIds, paymentStatus }
        }
      );
  }
}

/**
 * Create a new invoice
 * @param {import('../graphql/mutations/invoice').InvoiceCreateInput} invoiceData - The invoice data
 * @returns {Promise<Object>} The created invoice
 * @throws {PrintavoValidationError} When input validation fails
 * @throws {PrintavoAPIError} When creation fails
 */
async function createInvoice(invoiceData) {
  log(LOG_LEVELS.INFO, SERVICE_NAME, {
    action: 'createInvoice',
    contactId: invoiceData.contactId,
    lineItemsCount: invoiceData.lineItems?.length
  });
  
  try {
    await clientPromise;
    validateInvoiceInput(invoiceData);
    
    const input = {
      contact: { id: invoiceData.contactId },
      customerDueAt: invoiceData.dueDate || 
        new Date(Date.now() + DEFAULT_DUE_DATE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      lineItemGroups: [{
        lineItems: invoiceData.lineItems.map(item => ({
          product: { id: item.productId },
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price,
          imprints: item.imprints?.map(imp => ({
            name: imp.name,
            description: imp.description,
            location: imp.location,
            colors: imp.colors
          }))
        }))
      }],
      shippingAddress: invoiceData.shippingAddress,
      billingAddress: invoiceData.billingAddress,
      customerNote: invoiceData.customerNote,
      productionNote: invoiceData.productionNote,
      internalNote: invoiceData.internalNote,
      tags: invoiceData.tags,
      status: invoiceData.statusId ? { id: invoiceData.statusId } : undefined,
      paymentTerms: invoiceData.paymentTermsId ? { id: invoiceData.paymentTermsId } : undefined,
      deliveryMethod: invoiceData.deliveryMethodId ? { id: invoiceData.deliveryMethodId } : undefined,
      depositRequired: invoiceData.depositRequired
    };
    
    const data = await executeGraphQL(CREATE_INVOICE, { input });
    const response = data.invoiceCreate;
    
    if (response.errors?.length > 0) {
      throw new PrintavoValidationError(
        'Invoice creation failed',
        response.errors,
        { 
          action: 'createInvoice',
          contactId: invoiceData.contactId 
        }
      );
    }
    
    return response.invoice;
  } catch (error) {
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
      throw new PrintavoAPIError(
        'Failed to create invoice',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'createInvoice',
          contactId: invoiceData.contactId,
          originalError: error.message 
        }
      );
  }
}

/**
 * Update an existing invoice
 * @param {string} id - Invoice ID
 * @param {Object} updateData - Update data following InvoiceUpdateInput schema
 * @returns {Promise<Object>} Updated invoice
 * @throws {PrintavoValidationError} When update validation fails
 * @throws {PrintavoAPIError} When update fails
 */
async function updateInvoice(id, updateData) {
  log(LOG_LEVELS.INFO, SERVICE_NAME, { 
    action: 'updateInvoice',
    id,
    updateFields: Object.keys(updateData)
  });
  
  try {
    await clientPromise;
    
    const data = await executeGraphQL(UPDATE_INVOICE, {
      id,
      input: updateData
    });
    
    const response = data.invoiceUpdate;
    if (response.errors?.length > 0) {
      throw new PrintavoValidationError(
        'Invoice update failed',
        response.errors,
        { 
          action: 'updateInvoice',
          id 
        }
      );
    }
    
    return response.invoice;
  } catch (error) {
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
      throw new PrintavoAPIError(
        'Failed to update invoice',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'updateInvoice',
          id,
          originalError: error.message 
        }
      );
  }
}

/**
 * Delete an invoice
 * @param {string} id - Invoice ID
 * @returns {Promise<boolean>} Success status
 * @throws {PrintavoValidationError} When deletion validation fails
 * @throws {PrintavoAPIError} When deletion fails
 */
async function deleteInvoice(id) {
  log(LOG_LEVELS.INFO, SERVICE_NAME, { 
    action: 'deleteInvoice',
    id 
  });
  
  try {
    await clientPromise;
    
    const data = await executeGraphQL(DELETE_INVOICE, { id });
    
    const response = data.invoiceDelete;
    if (response.errors?.length > 0) {
      throw new PrintavoValidationError(
        'Invoice deletion failed',
        response.errors,
        { 
          action: 'deleteInvoice',
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
        'Failed to delete invoice',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'deleteInvoice',
          id,
          originalError: error.message 
        }
      );
  }
}

module.exports = {
  getInvoice,
  getRecentInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  // Export constants for testing and reuse
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_FIELD,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_DUE_DATE_DAYS
};
