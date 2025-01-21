/**
 * @fileoverview Printavo Service Facade
 * This module serves as the main entry point for all Printavo-related operations,
 * aggregating functionality from various specialized services into a single,
 * cohesive interface. It handles initialization of the GraphQL client and
 * provides access to all Printavo operations through a unified API.
 * 
 * @module printavoService
 * @version 1.0.0
 */

import graphqlClient from '../graphql/client.js';
import { 
  getInvoice, 
  getRecentInvoices, 
  createInvoice, 
  updateInvoice,
  deleteInvoice
} from './invoiceService.js';
import { 
  getAccount, 
  verifyConnection,
  getAccountUsers,
  getAccountStatuses,
  isCatalogEnabled
} from './accountService.js';
import { 
  findContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact
} from './contactService.js';
import { 
  getPreSubmitInfo,
  submitPO
} from './sanmarService.js';
import { 
  processInvoice
} from './ocrService.js';
import { 
  parseLineItems
} from './lineItemService.js';
import { LOG_LEVELS, log } from '../utils/logger.js';
import { 
  PrintavoAPIError, 
  PrintavoValidationError, 
  PrintavoAuthenticationError,
  ERROR_CODES
} from '../utils/errorHandling.js';

const SERVICE_NAME = 'PrintavoService';

// Log service initialization
log(LOG_LEVELS.INFO, SERVICE_NAME, {
  action: 'initialize',
  message: 'Initializing Printavo service'
});

/**
 * @typedef {Object} PrintavoService
 * @property {Object} account - Account management operations
 * @property {function(): Promise<Object>} account.getAccount - Get account details
 * @property {function(): Promise<boolean>} account.verifyConnection - Verify API connection
 * @property {function(): Promise<Array<Object>>} account.getAccountUsers - Get account users
 * @property {function(): Promise<Array<Object>>} account.getAccountStatuses - Get account statuses
 * @property {function(): Promise<boolean>} account.isCatalogEnabled - Check if catalog is enabled
 * 
 * @property {Object} contacts - Contact management operations
 * @property {function(Object): Promise<Array<Object>>} contacts.findContacts - Search contacts
 * @property {function(string): Promise<Object>} contacts.getContact - Get contact by ID
 * @property {function(Object): Promise<Object>} contacts.createContact - Create new contact
 * @property {function(string, Object): Promise<Object>} contacts.updateContact - Update contact
 * @property {function(string): Promise<boolean>} contacts.deleteContact - Delete contact
 * 
 * @property {Object} invoices - Invoice management operations
 * @property {function(string): Promise<Object>} invoices.getInvoice - Get invoice by ID
 * @property {function(Object): Promise<Object>} invoices.getRecentInvoices - Get recent invoices
 * @property {function(Object): Promise<Object>} invoices.createInvoice - Create new invoice
 * @property {function(string, Object): Promise<Object>} invoices.updateInvoice - Update invoice
 * @property {function(string): Promise<boolean>} invoices.deleteInvoice - Delete invoice
 * 
 * @property {Object} sanmar - SanMar integration operations
 * @property {function(Object): Promise<Object>} sanmar.getPreSubmitInfo - Get pre-submission info
 * @property {function(Object): Promise<Object>} sanmar.submitPO - Submit purchase order
 * 
 * @property {Object} processing - OCR and line item processing operations
 * @property {function(string): Promise<Object>} processing.processInvoice - Process invoice OCR
 * @property {function(string): Promise<Array<Object>>} processing.parseLineItems - Parse line items
 * 
 * @property {Object} errors - Error handling utilities
 * @property {Class} errors.PrintavoAPIError - API error class
 * @property {Class} errors.PrintavoValidationError - Validation error class
 * @property {Class} errors.PrintavoAuthenticationError - Authentication error class
 * @property {Object} errors.ERROR_CODES - Standardized error codes
 * @property {Object} errors.ERROR_CODES.VALIDATION - Validation error codes
 * @property {Object} errors.ERROR_CODES.API - API error codes
 * @property {Object} errors.ERROR_CODES.DATA - Data error codes
 * @property {Object} errors.ERROR_CODES.SYSTEM - System error codes
 */

/**
 * Printavo service interface providing access to all Printavo operations
 * @type {PrintavoService}
 */
const printavoService = {
  // Account Management
  account: {
    getAccount,
    verifyConnection,
    getAccountUsers,
    getAccountStatuses,
    isCatalogEnabled
  },

  // Contact Management
  contacts: {
    findContacts,
    getContact,
    createContact,
    updateContact,
    deleteContact
  },

  // Invoice Management
  invoices: {
    getInvoice,
    getRecentInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice
  },

  // SanMar Integration
  sanmar: {
    getPreSubmitInfo,
    submitPO
  },

  // OCR and Line Item Processing
  processing: {
    processInvoice,
    parseLineItems
  },

  // Error Handling
  errors: {
    PrintavoAPIError,
    PrintavoValidationError,
    PrintavoAuthenticationError,
    ERROR_CODES
  }
};

// Export the service interface
export default printavoService;
