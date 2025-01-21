import { LOG_LEVELS, log } from '../utils/logger.js';
import { executeGraphQL, clientPromise } from '../graphql/client.js';
import { PrintavoAPIError, PrintavoValidationError } from '../utils/errorHandling.js';

// GraphQL queries
const GET_ACCOUNT = `
  query Account {
    account {
      id
      companyName
      companyEmail
      phone
      website
      locale
      logoUrl
      paymentProcessorPresent
      address {
        address1
        address2
        city
        stateIso
        zipCode
        countryIso
      }
      catalogInformation {
        sanmar
        alphabroder
        ssActivewear
      }
      features
      enabledLineItemGroupColumns {
        quantity
        size
        color
        price
        cost
        markup
        profit
      }
      lineItemGroupSizes {
        code
        name
        size
      }
      timestamps {
        createdAt
        updatedAt
      }
    }
  }
`;

const GET_ACCOUNT_USERS = `
  query GetAccountUsers($first: Int, $after: String) {
    account {
      users(first: $first, after: $after) {
        nodes {
          id
          email
          firstName
          lastName
          role
          active
          avatar {
            urlSmall
            backgroundColor
            initials
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalNodes
      }
    }
  }
`;

const GET_ACCOUNT_STATUSES = `
  query GetAccountStatuses($type: StatusType) {
    account {
      orderStatuses(type: $type) {
        nodes {
          id
          name
          color
          type
          position
          timestamps {
            createdAt
            updatedAt
          }
        }
      }
    }
  }
`;

const UPDATE_ACCOUNT = `
  mutation UpdateAccount($input: AccountUpdateInput!) {
    accountUpdate(input: $input) {
      account {
        id
        companyName
        companyEmail
        phone
        website
        locale
        address {
          address1
          address2
          city
          stateIso
          zipCode
          countryIso
        }
      }
      errors {
        message
        path
      }
    }
  }
`;

/**
 * Get account details
 * @returns {Promise<Object>} Account data
 */
async function getAccount() {
  log(LOG_LEVELS.INFO, 'Fetching account details');
  
  try {
    // Wait for client initialization
    await clientPromise;
    
    const data = await executeGraphQL(GET_ACCOUNT);
    if (!data?.account) {
      throw new PrintavoAPIError(
        'No account data returned',
        'FETCH_ERROR'
      );
    }
    return data.account;
  } catch (error) {
    if (error instanceof PrintavoAPIError) {
      throw error;
    }
    throw new PrintavoAPIError(
      'Failed to fetch account details',
      'FETCH_ERROR',
      { originalError: error.message }
    );
  }
}

/**
 * Get account users with pagination
 * @param {Object} options Query options
 * @param {number} options.first Number of users to fetch (max 25)
 * @param {string} options.after Cursor for pagination
 * @returns {Promise<Object>} Users data with pagination info
 */
async function getAccountUsers(options = {}) {
  const { first = 25, after = null } = options;
  log(LOG_LEVELS.INFO, 'Fetching account users', { first, after });
  
  try {
    // Wait for client initialization
    await clientPromise;
    
    const data = await executeGraphQL(GET_ACCOUNT_USERS, { first, after });
    if (!data?.account?.users) {
      throw new PrintavoAPIError(
        'No users data returned',
        'FETCH_ERROR'
      );
    }
    return data.account.users;
  } catch (error) {
    throw new PrintavoAPIError(
      'Failed to fetch account users',
      'FETCH_ERROR',
      { originalError: error.message }
    );
  }
}

/**
 * Get account order statuses filtered by type
 * @param {string} type Status type filter (QUOTE, INVOICE, etc.)
 * @returns {Promise<Array>} List of order statuses
 */
async function getAccountStatuses(type = null) {
  log(LOG_LEVELS.INFO, 'Fetching account statuses', { type });
  
  try {
    // Wait for client initialization
    await clientPromise;
    
    const data = await executeGraphQL(GET_ACCOUNT_STATUSES, { type });
    if (!data?.account?.orderStatuses?.nodes) {
      throw new PrintavoAPIError(
        'No status data returned',
        'FETCH_ERROR'
      );
    }
    return data.account.orderStatuses.nodes;
  } catch (error) {
    throw new PrintavoAPIError(
      'Failed to fetch account statuses',
      'FETCH_ERROR',
      { originalError: error.message }
    );
  }
}

/**
 * Update account details
 * @param {Object} updateData Account update data
 * @returns {Promise<Object>} Updated account data
 */
async function updateAccount(updateData) {
  log(LOG_LEVELS.INFO, 'Updating account details');
  
  try {
    // Wait for client initialization
    await clientPromise;
    
    const data = await executeGraphQL(UPDATE_ACCOUNT, {
      input: updateData
    });
    
    const response = data?.accountUpdate;
    if (!response) {
      throw new PrintavoAPIError(
        'No response from update mutation',
        'UPDATE_ERROR'
      );
    }
    
    if (response.errors?.length > 0) {
      throw new PrintavoValidationError(
        'Account update failed',
        { errors: response.errors }
      );
    }
    
    return response.account;
  } catch (error) {
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
    throw new PrintavoAPIError(
      'Failed to update account',
      'UPDATE_ERROR',
      { originalError: error.message }
    );
  }
}

/**
 * Check if specific catalog integration is enabled
 * @param {string} catalog Catalog name (sanmar, alphabroder, ssActivewear)
 * @returns {Promise<boolean>} Whether the catalog is enabled
 */
async function isCatalogEnabled(catalog) {
  log(LOG_LEVELS.INFO, 'Checking catalog status', { catalog });
  
  try {
    const account = await getAccount();
    return account.catalogInformation?.[catalog] || false;
  } catch (error) {
    throw new PrintavoAPIError(
      'Failed to check catalog status',
      'FETCH_ERROR',
      { originalError: error.message }
    );
  }
}

/**
 * Verify connection to Printavo API
 * @returns {Promise<boolean>} Connection status
 */
async function verifyConnection() {
  log(LOG_LEVELS.INFO, 'Verifying Printavo API connection');
  
  try {
    const account = await getAccount();
    return Boolean(account?.id);
  } catch (error) {
    log(LOG_LEVELS.ERROR, 'API connection verification failed', {
      error: error.message
    });
    return false;
  }
}

export {
  getAccount,
  getAccountUsers,
  getAccountStatuses,
  updateAccount,
  isCatalogEnabled,
  verifyConnection
};
