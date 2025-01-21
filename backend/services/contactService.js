import { LOG_LEVELS, log } from '../utils/logger.js';
import { executeGraphQL, clientPromise } from '../graphql/client.js';
import { PrintavoAPIError, PrintavoValidationError, ERROR_CODES } from '../utils/errorHandling.js';
import { SEARCH_CONTACTS, GET_CONTACT } from '../graphql/queries/contact.js';
import { CREATE_CONTACT, UPDATE_CONTACT, DELETE_CONTACT } from '../graphql/mutations/contact.js';

// Constants
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_SORT_FIELD = 'CREATED_AT';
const DEFAULT_SORT_DIRECTION = true; // descending

const SERVICE_NAME = 'ContactService';

/**
 * Validate contact input data
 * @param {import('../graphql/mutations/contact').ContactCreateInput} contactData 
 * @throws {PrintavoValidationError} When validation fails
 */
function validateContactInput(contactData) {
  if (!contactData.fullName?.trim()) {
      throw new PrintavoValidationError(
        'Full name is required',
        { field: 'fullName', code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
      );
  }
  
  if (!contactData.email?.trim()) {
      throw new PrintavoValidationError(
        'Email is required',
        { field: 'email', code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
      );
  }
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(contactData.email)) {
      throw new PrintavoValidationError(
        'Invalid email format',
        { field: 'email', code: ERROR_CODES.VALIDATION.INVALID_FORMAT }
      );
  }
  
  if (contactData.address) {
    if (!contactData.address.address1?.trim()) {
      throw new PrintavoValidationError(
        'Street address is required when providing address',
        { field: 'address.address1', code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
      );
    }
    if (!contactData.address.city?.trim()) {
      throw new PrintavoValidationError(
        'City is required when providing address',
        { field: 'address.city', code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
      );
    }
    if (!contactData.address.stateIso?.trim()) {
      throw new PrintavoValidationError(
        'State is required when providing address',
        { field: 'address.stateIso', code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
      );
    }
    if (!contactData.address.zipCode?.trim()) {
      throw new PrintavoValidationError(
        'ZIP code is required when providing address',
        { field: 'address.zipCode', code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
      );
    }
    if (!contactData.address.countryIso?.trim()) {
      throw new PrintavoValidationError(
        'Country is required when providing address',
        { field: 'address.countryIso', code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
      );
    }
  }
}

/**
 * Find contacts by search query
 * @param {import('../graphql/queries/contact').ContactSearchOptions} options - Search options
 * @returns {Promise<{
 *   nodes: Array<import('../graphql/queries/contact').ContactFragment>,
 *   pageInfo: { hasNextPage: boolean, endCursor: string },
 *   totalNodes: number
 * }>} Search results with pagination info
 * @throws {PrintavoAPIError} When search fails
 */
async function findContacts(options) {
  const { 
    query, 
    first = DEFAULT_PAGE_SIZE, 
    after = null, 
    primaryOnly = false,
    sortOn = DEFAULT_SORT_FIELD,
    sortDescending = DEFAULT_SORT_DIRECTION
  } = options;
  
  if (!query?.trim()) {
      throw new PrintavoValidationError(
        'Search query is required',
        { field: 'query', code: ERROR_CODES.VALIDATION.REQUIRED_FIELD }
      );
  }
  
  log(LOG_LEVELS.INFO, SERVICE_NAME, { 
    action: 'findContacts',
    query,
    first,
    after,
    primaryOnly,
    sortOn,
    sortDescending
  });
  
  try {
    await clientPromise;
    
    const data = await executeGraphQL(SEARCH_CONTACTS, {
      query,
      first: Math.min(first, DEFAULT_PAGE_SIZE),
      after,
      primaryOnly,
      sortOn,
      sortDescending
    });
    
    if (!data?.contacts) {
      throw new PrintavoAPIError(
        'No contacts data returned',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { action: 'findContacts' }
      );
    }
    
    return data.contacts;
  } catch (error) {
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
      throw new PrintavoAPIError(
        'Failed to search for contacts',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'findContacts',
          originalError: error.message,
          query
        }
      );
  }
}

/**
 * Get a contact by ID
 * @param {string} id - Contact ID
 * @returns {Promise<import('../graphql/queries/contact').ContactFragment>} Contact data
 * @throws {PrintavoAPIError} When contact is not found or fetch fails
 */
async function getContact(id) {
  log(LOG_LEVELS.INFO, SERVICE_NAME, { 
    action: 'getContact',
    id 
  });
  
  try {
    await clientPromise;
    
    const data = await executeGraphQL(GET_CONTACT, { id });
    if (!data?.contact) {
      throw new PrintavoAPIError(
        'Contact not found',
        ERROR_CODES.DATA.NOT_FOUND,
        { 
          action: 'getContact',
          id 
        }
      );
    }
    
    return data.contact;
  } catch (error) {
    if (error instanceof PrintavoAPIError) {
      throw error;
    }
      throw new PrintavoAPIError(
        'Failed to fetch contact',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'getContact',
          id,
          originalError: error.message 
        }
      );
  }
}

/**
 * Create a new contact
 * @param {import('../graphql/mutations/contact').ContactCreateInput} contactData - Contact creation data
 * @returns {Promise<import('../graphql/queries/contact').ContactFragment>} Created contact
 * @throws {PrintavoValidationError} When input validation fails
 * @throws {PrintavoAPIError} When creation fails
 */
async function createContact(contactData) {
  log(LOG_LEVELS.INFO, SERVICE_NAME, { 
    action: 'createContact',
    email: contactData.email,
    fullName: contactData.fullName
  });
  
  try {
    validateContactInput(contactData);
    await clientPromise;
    
    const data = await executeGraphQL(CREATE_CONTACT, {
      input: contactData
    });
    
    const response = data?.contactCreate;
    if (!response) {
      throw new PrintavoAPIError(
        'No response from create mutation',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'createContact',
          email: contactData.email 
        }
      );
    }
    
    if (response.errors?.length > 0) {
      throw new PrintavoValidationError(
        'Contact creation failed',
        response.errors,
        { 
          action: 'createContact',
          email: contactData.email 
        }
      );
    }
    
    return response.contact;
  } catch (error) {
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
      throw new PrintavoAPIError(
        'Failed to create contact',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'createContact',
          email: contactData.email,
          originalError: error.message 
        }
      );
  }
}

/**
 * Update a contact's information
 * @param {string} id - Contact ID
 * @param {Object} updateData - Contact update data following ContactUpdateInput schema
 * @returns {Promise<import('../graphql/queries/contact').ContactFragment>} Updated contact
 * @throws {PrintavoValidationError} When update validation fails
 * @throws {PrintavoAPIError} When update fails
 */
async function updateContact(id, updateData) {
  log(LOG_LEVELS.INFO, SERVICE_NAME, { 
    action: 'updateContact',
    id,
    updateFields: Object.keys(updateData)
  });
  
  try {
    if (updateData.email || updateData.fullName || updateData.address) {
      validateContactInput({
        ...updateData,
        email: updateData.email || 'placeholder@example.com', // Add placeholder for partial validation
        fullName: updateData.fullName || 'Placeholder Name'
      });
    }
    
    await clientPromise;
    
    const data = await executeGraphQL(UPDATE_CONTACT, {
      id,
      input: updateData
    });
    
    const response = data?.contactUpdate;
    if (!response) {
      throw new PrintavoAPIError(
        'No response from update mutation',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'updateContact',
          id 
        }
      );
    }
    
    if (response.errors?.length > 0) {
      throw new PrintavoValidationError(
        'Contact update failed',
        response.errors,
        { 
          action: 'updateContact',
          id 
        }
      );
    }
    
    return response.contact;
  } catch (error) {
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
      throw new PrintavoAPIError(
        'Failed to update contact',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'updateContact',
          id,
          originalError: error.message 
        }
      );
  }
}

/**
 * Delete a contact
 * @param {string} id - Contact ID
 * @returns {Promise<boolean>} Success status
 * @throws {PrintavoValidationError} When deletion validation fails
 * @throws {PrintavoAPIError} When deletion fails
 */
async function deleteContact(id) {
  log(LOG_LEVELS.INFO, SERVICE_NAME, { 
    action: 'deleteContact',
    id 
  });
  
  try {
    await clientPromise;
    
    const data = await executeGraphQL(DELETE_CONTACT, { id });
    
    const response = data?.contactDelete;
    if (!response) {
      throw new PrintavoAPIError(
        'No response from delete mutation',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'deleteContact',
          id 
        }
      );
    }
    
    if (response.errors?.length > 0) {
      throw new PrintavoValidationError(
        'Contact deletion failed',
        response.errors,
        { 
          action: 'deleteContact',
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
        'Failed to delete contact',
        ERROR_CODES.API.SERVICE_UNAVAILABLE,
        { 
          action: 'deleteContact',
          id,
          originalError: error.message 
        }
      );
  }
}

export {
  findContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  // Export constants for testing
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_FIELD,
  DEFAULT_SORT_DIRECTION
};
