const debug = require('debug')('printavo:service');
const { randomUUID } = require('crypto');
const { z } = require('zod');

// Add logging configuration
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  TRACE: 'trace'
};

// Initialize variables for dynamic imports
let GraphQLClient;
let gql;
let client;

// Define GraphQL queries (will be initialized after gql is imported)
let GET_ACCOUNT;
let GET_INVOICE;
let GET_RECENT_INVOICES;
let CREATE_INVOICE;
let SEARCH_INVOICES;

// Dynamic import of graphql-request
async function importGraphQLRequest() {
  const { GraphQLClient: Client, gql: graphql } = await import('graphql-request');
  GraphQLClient = Client;
  gql = graphql;

  // Initialize GraphQL queries after gql is imported
  GET_ACCOUNT = gql`
    query {
      account {
        id
        name
        email
      }
    }
  `;

  GET_INVOICE = gql`
    query GetInvoice($id: ID!) {
      invoice(id: $id) {
        id
        visualId
        status {
          id
          name
        }
        contact {
          id
          fullName
          email
        }
        lineItemGroups {
          nodes {
            id
            lineItems {
              nodes {
                id
                product {
                  id
                  itemNumber
                  description
                }
                items
                price
                size
                color
              }
            }
          }
        }
        shippingAddress {
          address1
          address2
          city
          stateIso
          zipCode
          country
          phone
          email
        }
      }
    }
  `;

  GET_RECENT_INVOICES = gql`
    query GetRecentInvoices($first: Int!, $after: String) {
      invoices(first: $first, after: $after) {
        nodes {
          id
          visualId
          status {
            id
            name
          }
          contact {
            id
            fullName
            email
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  `;

  SEARCH_INVOICES = gql`
    query SearchInvoices($first: Int!, $statusIds: [ID], $inProductionAfter: DateTime, $inProductionBefore: DateTime) {
      invoices(
        first: $first,
        filter: {
          statusIds: $statusIds,
          inProductionAfter: $inProductionAfter,
          inProductionBefore: $inProductionBefore
        }
      ) {
        nodes {
          id
          visualId
          status {
            id
            name
          }
          contact {
            id
            fullName
            email
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  `;

  CREATE_INVOICE = gql`
    mutation CreateInvoice($input: InvoiceCreateInput!) {
      invoiceCreate(input: $input) {
        invoice {
          id
          visualId
          status {
            id
            name
          }
          contact {
            id
            fullName
            email
          }
          lineItemGroups {
            nodes {
              id
              lineItems {
                nodes {
                  id
                  product {
                    id
                    itemNumber
                    description
                  }
                  items
                  price
                  size
                  color
                }
              }
            }
          }
          shippingAddress {
            address1
            address2
            city
            stateIso
            zipCode
            country
            phone
            email
          }
        }
        errors {
          field
          message
        }
      }
    }
  `;
}

// Add logging configuration
const log = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    requestId: randomUUID(),
    ...data
  };

  // Remove sensitive data
  if (logEntry.headers) {
    delete logEntry.headers.token;
    delete logEntry.headers.email;
  }
  if (logEntry.error?.config?.headers) {
    delete logEntry.error.config.headers.token;
    delete logEntry.error.config.headers.email;
  }

  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error(JSON.stringify(logEntry));
      debug('ERROR:', logEntry);
      break;
    case LOG_LEVELS.WARN:
      console.warn(JSON.stringify(logEntry));
      debug('WARN:', logEntry);
      break;
    default:
      debug(logEntry);
  }
};

// Custom error classes for better error handling
class PrintavoAPIError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'PrintavoAPIError';
    this.code = code;
    this.details = details;
  }
}

class PrintavoValidationError extends PrintavoAPIError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'PrintavoValidationError';
  }
}

class PrintavoAuthenticationError extends PrintavoAPIError {
  constructor(message) {
    super(message, 'AUTHENTICATION_ERROR');
    this.name = 'PrintavoAuthenticationError';
  }
}

// Constants for validation
const VALIDATION_CONSTANTS = {
  MAX_LINE_ITEMS: 100,
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 10000,
  MAX_PRICE: 1000000,
  MAX_STRING_LENGTH: 255,
  VALID_STATE_CODES: [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ],
  VALID_COUNTRIES: ['US', 'USA', 'CA', 'CAN'],
  ZIP_CODE_PATTERNS: {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/
  },
  PHONE_PATTERN: /^\+?1?\d{10,14}$/,
  EMAIL_PATTERN: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
  PRODUCT_ID_PATTERN: /^[A-Za-z0-9-_]+$/,
  COLOR_PATTERN: /^[A-Za-z0-9\s-]+$/,
  SIZE_PATTERN: /^[A-Za-z0-9XSMLxsml\s-]+$/,
  STATUS_ID_PATTERN: /^[A-Za-z0-9-_]+$/,
  MAX_STATUS_IDS: 10,
  VALID_STATUS_IDS: [
    'new',
    'in_production',
    'ready_for_pickup',
    'shipped',
    'delivered',
    'cancelled',
    'on_hold',
    'pending_approval',
    'archived'
  ]
};

// Helper validation functions
const validateString = (value, fieldName, maxLength = VALIDATION_CONSTANTS.MAX_STRING_LENGTH) => {
  if (typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }
  if (value.trim().length === 0) {
    return `${fieldName} cannot be empty`;
  }
  if (value.length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }
  return null;
};

const validateEmail = (email) => {
  const error = validateString(email, 'Email');
  if (error) return error;
  if (!VALIDATION_CONSTANTS.EMAIL_PATTERN.test(email)) {
    return 'Invalid email format';
  }
  return null;
};

const validatePhone = (phone) => {
  if (!phone) return null; // Phone is optional
  if (!VALIDATION_CONSTANTS.PHONE_PATTERN.test(phone)) {
    return 'Invalid phone number format';
  }
  return null;
};

const validateZipCode = (zipCode, country = 'US') => {
  const pattern = VALIDATION_CONSTANTS.ZIP_CODE_PATTERNS[country];
  if (!pattern) return 'Unsupported country code';
  if (!pattern.test(zipCode)) {
    return `Invalid postal code format for ${country}`;
  }
  return null;
};

const validatePrice = (price) => {
  if (typeof price !== 'number') {
    return 'Price must be a number';
  }
  if (price < 0) {
    return 'Price cannot be negative';
  }
  if (price > VALIDATION_CONSTANTS.MAX_PRICE) {
    return `Price cannot exceed ${VALIDATION_CONSTANTS.MAX_PRICE}`;
  }
  return null;
};

const validateQuantity = (quantity) => {
  if (!Number.isInteger(quantity)) {
    return 'Quantity must be an integer';
  }
  if (quantity < VALIDATION_CONSTANTS.MIN_QUANTITY) {
    return `Quantity must be at least ${VALIDATION_CONSTANTS.MIN_QUANTITY}`;
  }
  if (quantity > VALIDATION_CONSTANTS.MAX_QUANTITY) {
    return `Quantity cannot exceed ${VALIDATION_CONSTANTS.MAX_QUANTITY}`;
  }
  return null;
};

// Add new helper function for status ID validation
const validateStatusId = (statusId) => {
  if (typeof statusId !== 'string') {
    return 'Status ID must be a string';
  }
  
  if (statusId.trim().length === 0) {
    return 'Status ID cannot be empty';
  }
  
  if (!VALIDATION_CONSTANTS.STATUS_ID_PATTERN.test(statusId)) {
    return 'Status ID contains invalid characters';
  }
  
  if (!VALIDATION_CONSTANTS.VALID_STATUS_IDS.includes(statusId.toLowerCase())) {
    return `Invalid status ID. Must be one of: ${VALIDATION_CONSTANTS.VALID_STATUS_IDS.join(', ')}`;
  }
  
  return null;
};

// Enhanced validation functions
const validateInvoiceInput = (invoiceData) => {
  log(LOG_LEVELS.DEBUG, 'Validating invoice input', {
    contactId: invoiceData.contactId,
    lineItemsCount: invoiceData.lineItems?.length,
    hasShippingAddress: !!invoiceData.shippingAddress
  });

  const errors = [];

  // Contact validation
  if (!invoiceData.contactId) {
    errors.push('contactId is required');
  } else {
    const contactError = validateString(invoiceData.contactId, 'contactId');
    if (contactError) errors.push(contactError);
  }

  // Line items validation
  if (!invoiceData.lineItems || !Array.isArray(invoiceData.lineItems)) {
    errors.push('lineItems must be an array');
  } else if (invoiceData.lineItems.length === 0) {
    errors.push('lineItems cannot be empty');
  } else if (invoiceData.lineItems.length > VALIDATION_CONSTANTS.MAX_LINE_ITEMS) {
    errors.push(`Cannot exceed ${VALIDATION_CONSTANTS.MAX_LINE_ITEMS} line items`);
  } else {
    invoiceData.lineItems.forEach((item, index) => {
      // Product ID validation
      if (!item.productId) {
        errors.push(`lineItems[${index}]: productId is required`);
      } else if (!VALIDATION_CONSTANTS.PRODUCT_ID_PATTERN.test(item.productId)) {
        errors.push(`lineItems[${index}]: invalid productId format`);
      }

      // Quantity validation
      const quantityError = validateQuantity(item.quantity);
      if (quantityError) {
        errors.push(`lineItems[${index}]: ${quantityError}`);
      }

      // Price validation
      if (item.price !== undefined) {
        const priceError = validatePrice(item.price);
        if (priceError) {
          errors.push(`lineItems[${index}]: ${priceError}`);
        }
      }

      // Size validation
      if (!item.size) {
        errors.push(`lineItems[${index}]: size is required`);
      } else if (!VALIDATION_CONSTANTS.SIZE_PATTERN.test(item.size)) {
        errors.push(`lineItems[${index}]: invalid size format`);
      }

      // Color validation
      if (!item.color) {
        errors.push(`lineItems[${index}]: color is required`);
      } else if (!VALIDATION_CONSTANTS.COLOR_PATTERN.test(item.color)) {
        errors.push(`lineItems[${index}]: invalid color format`);
      }
    });
  }

  // Shipping address validation
  if (!invoiceData.shippingAddress) {
    errors.push('shippingAddress is required');
  } else {
    const address = invoiceData.shippingAddress;
    
    // Address validation
    const addressError = validateString(address.address1, 'shippingAddress.address1');
    if (addressError) errors.push(addressError);

    // City validation
    const cityError = validateString(address.city, 'shippingAddress.city');
    if (cityError) errors.push(cityError);

    // State validation
    if (!address.stateIso) {
      errors.push('shippingAddress.stateIso is required');
    } else if (!VALIDATION_CONSTANTS.VALID_STATE_CODES.includes(address.stateIso.toUpperCase())) {
      errors.push('shippingAddress.stateIso: invalid state code');
    }

    // ZIP code validation
    if (!address.zipCode) {
      errors.push('shippingAddress.zipCode is required');
    } else {
      const zipError = validateZipCode(address.zipCode, address.country || 'US');
      if (zipError) errors.push(`shippingAddress.zipCode: ${zipError}`);
    }

    // Country validation
    if (address.country && !VALIDATION_CONSTANTS.VALID_COUNTRIES.includes(address.country.toUpperCase())) {
      errors.push('shippingAddress.country: unsupported country');
    }

    // Optional phone validation
    if (address.phone) {
      const phoneError = validatePhone(address.phone);
      if (phoneError) errors.push(`shippingAddress.phone: ${phoneError}`);
    }

    // Optional email validation
    if (address.email) {
      const emailError = validateEmail(address.email);
      if (emailError) errors.push(`shippingAddress.email: ${emailError}`);
    }
  }

  // Due date validation
  if (invoiceData.dueDate) {
    if (!isValidDate(invoiceData.dueDate)) {
      errors.push('dueDate must be a valid ISO8601 date');
    } else {
      const dueDate = new Date(invoiceData.dueDate);
      const now = new Date();
      if (dueDate < now) {
        errors.push('dueDate cannot be in the past');
      }
    }
  }

  if (errors.length > 0) {
    log(LOG_LEVELS.WARN, 'Invoice validation failed', { errors });
    throw new PrintavoValidationError('Invoice validation failed', { errors });
  }

  log(LOG_LEVELS.DEBUG, 'Invoice validation successful');
};

const validateSearchCriteria = ({ statusIds, dateRange, first, ...otherCriteria }) => {
  const errors = [];

  // Enhanced Status IDs validation
  if (statusIds !== undefined) {
    if (!Array.isArray(statusIds)) {
      errors.push('statusIds must be an array');
    } else {
      if (statusIds.length > VALIDATION_CONSTANTS.MAX_STATUS_IDS) {
        errors.push(`Cannot search for more than ${VALIDATION_CONSTANTS.MAX_STATUS_IDS} status IDs at once`);
      }
      
      // Check for duplicates
      const uniqueStatusIds = new Set(statusIds.map(id => id?.toLowerCase()));
      if (uniqueStatusIds.size !== statusIds.length) {
        errors.push('Duplicate status IDs are not allowed');
      }
      
      statusIds.forEach((id, index) => {
        if (id === null || id === undefined) {
          errors.push(`statusIds[${index}]: Status ID cannot be null or undefined`);
        } else {
          const statusError = validateStatusId(id);
          if (statusError) {
            errors.push(`statusIds[${index}]: ${statusError}`);
          }
        }
      });
    }
  }

  // Date range validation
  if (dateRange) {
    if (typeof dateRange !== 'object') {
      errors.push('dateRange must be an object');
    } else {
      if (dateRange.start && !isValidDate(dateRange.start)) {
        errors.push('dateRange.start must be a valid ISO8601 date');
      }
      if (dateRange.end && !isValidDate(dateRange.end)) {
        errors.push('dateRange.end must be a valid ISO8601 date');
      }
      if (dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        if (start > end) {
          errors.push('dateRange.start must be before dateRange.end');
        }
        if (end > new Date()) {
          errors.push('dateRange.end cannot be in the future');
        }
      }
    }
  }

  // Pagination validation
  if (first !== undefined) {
    if (!Number.isInteger(first)) {
      errors.push('first must be an integer');
    } else if (first <= 0) {
      errors.push('first must be positive');
    } else if (first > 100) {
      errors.push('first cannot exceed 100');
    }
  }

  // Check for unexpected criteria
  const validCriteria = ['statusIds', 'dateRange', 'first'];
  Object.keys(otherCriteria).forEach(key => {
    if (!validCriteria.includes(key)) {
      errors.push(`Unknown search criteria: ${key}`);
    }
  });

  if (errors.length > 0) {
    throw new PrintavoValidationError('Search criteria validation failed', { errors });
  }
};

const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString.includes('T');
};

// Update the client initialization
const initializeClient = async () => {
  log(LOG_LEVELS.INFO, 'Initializing Printavo client');
  try {
    // Import graphql-request dynamically
    await importGraphQLRequest();

    // Validate environment variables
    const requiredEnvVars = {
      PRINTAVO_API_URL: process.env.PRINTAVO_API_URL,
      PRINTAVO_ACCESS_TOKEN: process.env.PRINTAVO_ACCESS_TOKEN,
      PRINTAVO_EMAIL: process.env.PRINTAVO_EMAIL
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      log(LOG_LEVELS.ERROR, 'Missing environment variables', { missingVars });
      throw new PrintavoAPIError(
        `Missing required environment variables: ${missingVars.join(', ')}`,
        'CONFIG_ERROR'
      );
    }

    // Create GraphQLClient instance with correct headers
    client = new GraphQLClient(process.env.PRINTAVO_API_URL, {
      headers: {
        'Content-Type': 'application/json',
        'email': process.env.PRINTAVO_EMAIL,
        'token': process.env.PRINTAVO_ACCESS_TOKEN
      }
    });

    return client;
  } catch (error) {
    log(LOG_LEVELS.ERROR, 'Failed to initialize client', { 
      error: error.message,
      stack: error.stack
    });
    throw new PrintavoAPIError(
      'Failed to initialize Printavo client',
      'INITIALIZATION_ERROR',
      { originalError: error.message }
    );
  }
};

// Update the GraphQL request function
async function executeGraphQL(query, variables = {}, options = { maxRetries: 3, retryDelay: 1000 }) {
  await clientPromise;
  let lastError;
  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      const data = await client.request(query, variables);
        
      if (data.errors) {
        log(LOG_LEVELS.ERROR, 'GraphQL query failed', {
          errors: data.errors,
          query,
          variables
        });
        throw new PrintavoAPIError(
          'GraphQL query failed',
          'GRAPHQL_ERROR',
          { errors: data.errors }
        );
      }
      return data;
    } catch(error) {
      lastError = error;
      log(LOG_LEVELS.ERROR, 'GraphQL request failed', {
        error: error.message,
        status: error.response?.status,
        query,
        variables
      });
      if (error.response?.status === 429) {
        const retryDelay = options.retryDelay * attempt;
        log(LOG_LEVELS.WARN, 'Rate limit hit, retrying', {
          attempt,
          retryDelay
        });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
        
      if (error instanceof PrintavoAPIError) {
        throw error;
      }
      if (error.response?.status === 401) {
        throw new PrintavoAuthenticationError('Invalid credentials');
      }
      if (error.response?.status === 403) {
        throw new PrintavoAuthenticationError('Access forbidden - check API permissions');
      }
      throw new PrintavoAPIError(
        'GraphQL request failed',
        'REQUEST_ERROR',
        { originalError: error.message }
      );
    }
  }
  throw new PrintavoAPIError(
    `Failed to fetch data after ${options.maxRetries} attempts`,
    'FETCH_ERROR',
    { originalError: lastError.message }
  );
}

// Update verifyConnection to use the new executeGraphQL function
async function verifyConnection() {
  try {
    const query = `
      query {
        account {
          id
        }
      }
    `;
    
    const data = await executeGraphQL(query);
    if (!data?.data?.account) {
      throw new PrintavoAuthenticationError('Failed to authenticate with Printavo API');
    }
    return true;
  } catch (error) {
    if (error instanceof PrintavoAPIError) {
      throw error;
    }
    throw new PrintavoAPIError(
      'Failed to verify API connection',
      'CONNECTION_ERROR',
      { originalError: error.message }
    );
  }
}

// Update findContactByEmail to use the new executeGraphQL function
async function findContactByEmail(email) {
  log(LOG_LEVELS.INFO, 'Looking up contact by email', { email });
  
  try {
    const query = `
      query SearchContact($email: String!) {
        contacts(filter: { email: $email }, first: 1) {
          nodes {
            id
            fullName
            email
            phone
            company
          }
        }
      }
    `;

    const data = await executeGraphQL(query, { email });
    
    if (!data?.data?.contacts?.nodes) {
      log(LOG_LEVELS.WARN, 'Invalid response format');
      throw new PrintavoAPIError('Invalid response format', 'RESPONSE_ERROR');
    }

    const contact = data.data.contacts.nodes[0];
    if (contact) {
      log(LOG_LEVELS.INFO, 'Contact found', {
        id: contact.id,
        fullName: contact.fullName
      });
    } else {
      log(LOG_LEVELS.INFO, 'No contact found with this email');
    }

    return contact || null;
  } catch (error) {
    log(LOG_LEVELS.ERROR, 'Error searching for contact', {
      error: error.message,
      type: error.constructor.name
    });
    throw new PrintavoAPIError(
      'Failed to search for contact',
      'SEARCH_ERROR',
      { originalError: error.message }
    );
  }
}

// Initialize the client
let clientPromise = initializeClient().catch(error => {
  console.error('Failed to initialize Printavo client:', error);
  throw error;
});

// TypeScript type generation from Zod schemas
/** @typedef {z.infer<typeof addressSchema>} Address */
/** @typedef {z.infer<typeof lineItemSchema>} LineItem */
/** @typedef {z.infer<typeof lineItemGroupSchema>} LineItemGroup */
/** @typedef {z.infer<typeof invoiceSchema>} Invoice */
/** @typedef {z.infer<typeof invoicesResponseSchema>} InvoicesResponse */
/** @typedef {z.infer<typeof invoiceCreateResponseSchema>} InvoiceCreateResponse */
/** @typedef {z.infer<typeof searchInvoicesResponseSchema>} SearchInvoicesResponse */

// Enhanced Zod schemas with more specific validations
const addressSchema = z.object({
  address1: z.string().trim().min(1, 'Address 1 is required').max(255, 'Address 1 cannot exceed 255 characters'),
  address2: z.string().trim().max(255, 'Address 2 cannot exceed 255 characters').optional(),
  city: z.string().trim().min(1, 'City is required').max(255, 'City cannot exceed 255 characters'),
  stateIso: z.string().trim().length(2, 'State ISO code must be exactly 2 characters')
    .refine(val => VALIDATION_CONSTANTS.VALID_STATE_CODES.includes(val.toUpperCase()), 'Invalid state code'),
  country: z.string().trim().transform(val => val.toUpperCase())
    .refine(val => VALIDATION_CONSTANTS.VALID_COUNTRIES.includes(val), 'Invalid country code')
    .optional(),
  zipCode: z.string().trim().min(1, 'Zip code is required')
    .refine(
      (val, ctx) => {
        const country = ctx.parent.country || 'US';
        const pattern = VALIDATION_CONSTANTS.ZIP_CODE_PATTERNS[country];
        return pattern.test(val);
      },
      ctx => `Invalid postal code format for ${ctx.parent.country || 'US'}`
    ),
  phone: z.string().trim()
    .refine(val => !val || VALIDATION_CONSTANTS.PHONE_PATTERN.test(val), 'Invalid phone number format')
    .optional(),
  email: z.string().trim().email('Invalid email format').optional()
});

const lineItemSchema = z.object({
  id: z.string(),
  product: z.object({
    id: z.string().regex(VALIDATION_CONSTANTS.PRODUCT_ID_PATTERN, 'Invalid product ID'),
    itemNumber: z.string().optional(),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional()
  }),
  items: z.number().int()
    .min(VALIDATION_CONSTANTS.MIN_QUANTITY, `Quantity must be at least ${VALIDATION_CONSTANTS.MIN_QUANTITY}`)
    .max(VALIDATION_CONSTANTS.MAX_QUANTITY, `Quantity cannot exceed ${VALIDATION_CONSTANTS.MAX_QUANTITY}`),
  price: z.number()
    .nonnegative('Price cannot be negative')
    .max(VALIDATION_CONSTANTS.MAX_PRICE, `Price cannot exceed ${VALIDATION_CONSTANTS.MAX_PRICE}`),
  size: z.string().trim().regex(VALIDATION_CONSTANTS.SIZE_PATTERN, 'Invalid size format'),
  color: z.string().trim().regex(VALIDATION_CONSTANTS.COLOR_PATTERN, 'Invalid color format')
});

const lineItemGroupSchema = z.object({
  id: z.string(),
  lineItems: z.object({
    nodes: z.array(lineItemSchema)
      .min(1, 'At least one line item is required')
      .max(VALIDATION_CONSTANTS.MAX_LINE_ITEMS, `Cannot exceed ${VALIDATION_CONSTANTS.MAX_LINE_ITEMS} line items`)
  })
});

const invoiceSchema = z.object({
  id: z.string().min(1, 'Invoice ID is required'),
  visualId: z.string().optional(),
  status: z.object({
    id: z.string().refine(val => VALIDATION_CONSTANTS.VALID_STATUS_IDS.includes(val.toLowerCase()), 'Invalid status ID'),
    name: z.string()
  }),
  contact: z.object({
    id: z.string().min(1, 'Contact ID is required'),
    fullName: z.string().min(1, 'Contact name is required'),
    email: z.string().email('Invalid email format').optional()
  }),
  lineItemGroups: z.object({
    nodes: z.array(lineItemGroupSchema)
      .min(1, 'At least one line item group is required')
  }),
  shippingAddress: addressSchema.optional()
});

const invoicesResponseSchema = z.object({
  nodes: z.array(invoiceSchema)
    .max(25, 'Cannot exceed 25 invoices per page'),
  pageInfo: z.object({
    hasNextPage: z.boolean(),
    endCursor: z.string().nullable()
  }),
  totalCount: z.number().int().nonnegative('Total count must be non-negative')
});

const invoiceCreateResponseSchema = z.object({
  invoice: invoiceSchema,
  errors: z.array(z.object({
    field: z.string().min(1, 'Error field is required'),
    message: z.string().min(1, 'Error message is required')
  }))
    .optional()
    .transform(val => val || [])
});

const searchInvoicesResponseSchema = z.object({
  invoices: invoicesResponseSchema
});

/**
 * Fetch a specific invoice by ID with retries
 * @param {string} invoiceId - The ID of the invoice to fetch
 * @param {Object} options - Options for the request
 * @returns {Promise<Object>} The invoice data
 */
async function getInvoice(invoiceId, options = { maxRetries: 3, retryDelay: 1000 }) {
  log(LOG_LEVELS.INFO, 'Fetching invoice', { invoiceId, options });
  await clientPromise;
  let lastError;
  
  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      if (!invoiceId) {
        log(LOG_LEVELS.ERROR, 'Invoice ID missing');
        throw new PrintavoValidationError('Invoice ID is required');
      }

      log(LOG_LEVELS.DEBUG, 'Making API request', { 
        attempt,
        invoiceId 
      });

      const data = await client.request(GET_INVOICE, { id: invoiceId });
      
      if (!data?.invoice) {
        log(LOG_LEVELS.WARN, 'Invoice not found', { invoiceId });
        throw new PrintavoAPIError('Invoice not found', 'NOT_FOUND');
      }

      // Validate response data against schema
      try {
        const parsedInvoice = invoiceSchema.parse(data.invoice);
        log(LOG_LEVELS.INFO, 'Invoice fetched and validated successfully', {
          invoiceId: parsedInvoice.id,
          visualId: parsedInvoice.visualId
        });
        return parsedInvoice;
      } catch (validationError) {
        log(LOG_LEVELS.ERROR, 'Invoice response validation failed', {
          errors: validationError.errors,
          invoiceId
        });
        throw new PrintavoAPIError(
          'Invalid invoice response format',
          'VALIDATION_ERROR',
          { errors: validationError.errors }
        );
      }
    } catch (error) {
      lastError = error;
      log(LOG_LEVELS.ERROR, 'Error fetching invoice', {
        attempt,
        error: error.message,
        status: error.response?.status,
        isRateLimit: error.response?.status === 429
      });

      if (error instanceof PrintavoValidationError) {
        throw error; // Don't retry validation errors
      }

      if (error.response?.status === 429) {
        const retryDelay = options.retryDelay * attempt;
        log(LOG_LEVELS.WARN, 'Rate limit hit, retrying', {
          attempt,
          retryDelay
        });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      if (attempt === options.maxRetries) {
        break;
      }

      log(LOG_LEVELS.DEBUG, 'Retrying request', {
        attempt,
        nextRetryIn: options.retryDelay
      });
      await new Promise(resolve => setTimeout(resolve, options.retryDelay));
    }
  }

  const finalError = new PrintavoAPIError(
    `Failed to fetch invoice after ${options.maxRetries} attempts`,
    'FETCH_ERROR',
    { originalError: lastError.message }
  );
  
  log(LOG_LEVELS.ERROR, 'All retry attempts failed', {
    invoiceId,
    maxRetries: options.maxRetries,
    finalError: finalError.message
  });
  
  throw finalError;
}

/**
 * Fetch recent invoices with pagination
 * @param {number} first - Number of invoices to fetch
 * @param {string} [after] - Cursor for pagination
 * @returns {Promise<Object>} List of invoices and pagination info
 */
async function getRecentInvoices(first = 10, after = null) {
  log(LOG_LEVELS.INFO, 'Fetching recent invoices', { first, after });
  await clientPromise;
  
  try {
    const data = await executeGraphQL(GET_RECENT_INVOICES, { 
      first: Math.min(first, 25), // Printavo limits to 25 per page
      after 
    });

    try {
      const parsedData = invoicesResponseSchema.parse(data.invoices);
      log(LOG_LEVELS.INFO, 'Recent invoices fetched successfully', {
        count: parsedData.nodes.length,
        hasMore: parsedData.pageInfo.hasNextPage
      });
      return parsedData;
    } catch (validationError) {
      log(LOG_LEVELS.ERROR, 'Recent invoices response validation failed', {
        errors: validationError.errors
      });
      throw new PrintavoAPIError(
        'Invalid response format',
        'VALIDATION_ERROR',
        { errors: validationError.errors }
      );
    }
  } catch (error) {
    log(LOG_LEVELS.ERROR, 'Error fetching recent invoices', {
      error: error.message,
      type: error.constructor.name
    });
    if (error instanceof PrintavoAPIError) {
      throw error;
    }
    throw new PrintavoAPIError(
      'Failed to fetch recent invoices',
      'FETCH_ERROR',
      { originalError: error.message }
    );
  }
}

/**
 * Create a new invoice in Printavo with validation
 * @param {Object} invoiceData - The invoice data to create
 * @returns {Promise<Object>} The created invoice
 */
async function createInvoice(invoiceData) {
  log(LOG_LEVELS.INFO, 'Creating invoice', {
    contactId: invoiceData.contactId,
    lineItemsCount: invoiceData.lineItems?.length
  });

  await clientPromise;
  try {
    log(LOG_LEVELS.DEBUG, 'Validating invoice data');
    validateInvoiceInput(invoiceData);

    log(LOG_LEVELS.DEBUG, 'Making API request to create invoice');
    const data = await executeGraphQL(CREATE_INVOICE, {
      input: {
        contact: { id: invoiceData.contactId },
        customerDueAt: invoiceData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        lineItemGroups: [
          {
            lineItems: invoiceData.lineItems.map(item => ({
              product: { id: item.productId },
              items: item.quantity,
              price: item.price || 0,
              size: item.size,
              color: item.color
            }))
          }
        ],
        shippingAddress: invoiceData.shippingAddress
      }
    });

    try {
      const parsedResponse = invoiceCreateResponseSchema.parse(data.invoiceCreate);
      if (parsedResponse.errors?.length > 0) {
        log(LOG_LEVELS.WARN, 'Invoice creation failed', {
          errors: parsedResponse.errors
        });
        throw new PrintavoValidationError(
          'Invoice creation failed',
          { errors: parsedResponse.errors }
        );
      }

      log(LOG_LEVELS.INFO, 'Invoice created successfully', {
        invoiceId: parsedResponse.invoice.id,
        visualId: parsedResponse.invoice.visualId
      });

      return parsedResponse.invoice;
    } catch (validationError) {
      log(LOG_LEVELS.ERROR, 'Invoice creation response validation failed', {
        errors: validationError.errors
      });
      throw new PrintavoAPIError(
        'Invalid response format',
        'VALIDATION_ERROR',
        { errors: validationError.errors }
      );
    }
  } catch (error) {
    log(LOG_LEVELS.ERROR, 'Error creating invoice', {
      error: error.message,
      type: error.constructor.name,
      hasGraphQLErrors: !!error.response?.errors
    });

    if (error instanceof PrintavoAPIError) {
      throw error;
    }

    throw new PrintavoAPIError(
      'Failed to create invoice',
      'CREATE_ERROR',
      { originalError: error.message }
    );
  }
}

/**
 * Search for invoices by various criteria with validation
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Array>} Matching invoices
 */
async function searchInvoices(criteria) {
  log(LOG_LEVELS.INFO, 'Searching invoices', { criteria });
  await clientPromise;
  try {
    validateSearchCriteria(criteria);

    const variables = {
      first: Math.min(criteria.first || 25, 25),
      statusIds: criteria.statusIds?.length > 0 ? criteria.statusIds : undefined,
      inProductionAfter: criteria.dateRange?.start,
      inProductionBefore: criteria.dateRange?.end
    };

    const data = await executeGraphQL(SEARCH_INVOICES, variables);

    try {
      const parsedData = searchInvoicesResponseSchema.parse(data);
      log(LOG_LEVELS.INFO, 'Invoices search successful', {
        count: parsedData.invoices.nodes.length,
        hasMore: parsedData.invoices.pageInfo.hasNextPage
      });
      return parsedData.invoices;
    } catch (validationError) {
      log(LOG_LEVELS.ERROR, 'Search invoices response validation failed', {
        errors: validationError.errors
      });
      throw new PrintavoAPIError(
        'Invalid response format',
        'VALIDATION_ERROR',
        { errors: validationError.errors }
      );
    }
  } catch (error) {
    if (error instanceof PrintavoAPIError) {
      throw error;
    }

    throw new PrintavoAPIError(
      'Failed to search invoices',
      'SEARCH_ERROR',
      { originalError: error.message }
    );
  }
}

/**
 * Fetch account information
 * @returns {Promise<Object>} The account data
 */
async function getAccount() {
  await clientPromise;
  try {
    const data = await client.request(GET_ACCOUNT);
    return data.account;
  } catch (error) {
    console.error('Error fetching account:', error);
    throw new Error(`Failed to fetch account: ${error.message}`);
  }
}

// Export error classes for error handling in the application
module.exports = {
  getInvoice,
  getRecentInvoices,
  createInvoice,
  searchInvoices,
  getAccount,
  verifyConnection,
  PrintavoAPIError,
  PrintavoValidationError,
  PrintavoAuthenticationError,
  findContactByEmail
};
