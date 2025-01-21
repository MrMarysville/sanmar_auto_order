const { LOG_LEVELS, log } = require('../utils/logger');
const { executeGraphQL, clientPromise } = require('../graphql/client');
const { validateQuoteInput } = require('../validation/utils');
const { PrintavoAPIError, PrintavoValidationError } = require('../utils/errorHandling');
const { SIZE_DISTRIBUTIONS, PRODUCT_DEFAULTS, IMPRINT_LOCATIONS } = require('../constants/productDefaults');

// Add product search query
const SEARCH_PRODUCT = `
  query SearchProduct($sku: String, $name: String) {
    products(
      first: 1,
      sku: $sku,
      searchTerm: $name
    ) {
      nodes {
        id
        name
        sku
        description
        category {
          id
          name
        }
        defaultPrice
        defaultMarkup
      }
    }
  }
`;

// Add contact history query
const GET_CONTACT_HISTORY = `
  query GetContactHistory($contactId: ID!) {
    contact(id: $contactId) {
      id
      recentOrders: orders(first: 1) {
        nodes {
          shippingAddress {
            companyName
            customerName
            address1
            address2
            city
            stateIso
            zipCode
            countryIso
          }
          paymentTerms {
            id
            name
          }
          deliveryMethod {
            id
            name
          }
        }
      }
    }
  }
`;

// Add contact search query
const SEARCH_CONTACT = `
  query SearchContact($email: String, $fullName: String) {
    contacts(
      first: 1,
      email: $email,
      searchTerm: $fullName
    ) {
      nodes {
        id
        email
        fullName
        phone
        company {
          id
          name
        }
      }
    }
  }
`;

// GraphQL queries
const GET_QUOTE = `
  query GetQuote($id: ID!) {
    quote(id: $id) {
      id
      visualId
      customerDueAt
      contact {
        id
        email
        fullName
        phone
        company {
          id
          name
        }
      }
      owner {
        id
        email
        firstName
        lastName
      }
      status {
        id
        name
        color
        type
        position
      }
      lineItemGroups {
        nodes {
          id
          name
          description
          position
          lineItems {
            nodes {
              id
              product {
                id
                name
                sku
                description
                category {
                  id
                  name
                }
              }
              quantity
              size
              color
              price
              cost
              markup
              profit
              mockups {
                nodes {
                  id
                  url
                  position
                }
              }
              imprints {
                nodes {
                  id
                  name
                  description
                  location
                  colors
                  mockupUrl
                }
              }
            }
          }
        }
      }
      shippingAddress {
        companyName
        customerName
        address1
        address2
        city
        stateIso
        zipCode
        countryIso
      }
      billingAddress {
        companyName
        customerName
        address1
        address2
        city
        stateIso
        zipCode
        countryIso
      }
      customerNote
      productionNote
      internalNote
      tags
      paymentStatus
      paymentProcessor
      paymentTerms {
        id
        name
        description
        daysUntilDue
      }
      deliveryMethod {
        id
        name
        description
      }
      approvals {
        nodes {
          id
          status
          requestedAt
          respondedAt
          mockupUrl
        }
      }
      subtotal
      tax
      shipping
      total
      balance
      depositRequired
      depositPaid
      timestamps {
        createdAt
        updatedAt
        deletedAt
        inProductionAt
        completedAt
      }
    }
  }
`;

const GET_RECENT_QUOTES = `
  query GetRecentQuotes(
    $first: Int
    $after: String
    $statusIds: [ID!]
    $inProductionAfter: ISO8601DateTime
    $inProductionBefore: ISO8601DateTime
    $paymentStatus: OrderPaymentStatus
    $sortOn: OrderSortField
    $sortDescending: Boolean
    $searchTerm: String
    $tags: [String!]
  ) {
    quotes(
      first: $first
      after: $after
      statusIds: $statusIds
      inProductionAfter: $inProductionAfter
      inProductionBefore: $inProductionBefore
      paymentStatus: $paymentStatus
      sortOn: $sortOn
      sortDescending: $sortDescending
      searchTerm: $searchTerm
      tags: $tags
    ) {
      nodes {
        id
        visualId
        customerDueAt
        contact {
          id
          email
          fullName
          company {
            id
            name
          }
        }
        status {
          id
          name
          color
          type
        }
        lineItemGroups {
          nodes {
            id
            name
            lineItems {
              nodes {
                id
                quantity
                size
                color
                price
                product {
                  id
                  name
                  sku
                }
              }
            }
          }
        }
        paymentStatus
        subtotal
        tax
        shipping
        total
        balance
        tags
        timestamps {
          createdAt
          updatedAt
          inProductionAt
          completedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalNodes
    }
  }
`;

const CREATE_QUOTE = `
  mutation CreateQuote($input: QuoteCreateInput!) {
    quoteCreate(input: $input) {
      quote {
        id
        visualId
        customerDueAt
        contact {
          id
          email
          fullName
        }
        status {
          id
          name
          color
        }
        lineItemGroups {
          nodes {
            id
            name
            lineItems {
              nodes {
                id
                quantity
                size
                color
                price
                product {
                  id
                  name
                  sku
                }
              }
            }
          }
        }
        shippingAddress {
          companyName
          customerName
          address1
          address2
          city
          stateIso
          zipCode
          countryIso
        }
        billingAddress {
          companyName
          customerName
          address1
          address2
          city
          stateIso
          zipCode
          countryIso
        }
        customerNote
        productionNote
        internalNote
        tags
        paymentStatus
        paymentTerms {
          id
          name
        }
        deliveryMethod {
          id
          name
        }
        subtotal
        tax
        shipping
        total
        balance
        depositRequired
      }
      errors {
        message
        path
      }
    }
  }
`;

const UPDATE_QUOTE = `
  mutation UpdateQuote($id: ID!, $input: QuoteUpdateInput!) {
    quoteUpdate(id: $id, input: $input) {
      quote {
        id
        visualId
        customerDueAt
        contact {
          id
          email
          fullName
        }
        status {
          id
          name
          color
        }
        lineItemGroups {
          nodes {
            id
            name
            lineItems {
              nodes {
                id
                quantity
                size
                color
                price
                product {
                  id
                  name
                  sku
                }
              }
            }
          }
        }
        shippingAddress {
          companyName
          customerName
          address1
          address2
          city
          stateIso
          zipCode
          countryIso
        }
        billingAddress {
          companyName
          customerName
          address1
          address2
          city
          stateIso
          zipCode
          countryIso
        }
        customerNote
        productionNote
        internalNote
        tags
        paymentStatus
        paymentTerms {
          id
          name
        }
        deliveryMethod {
          id
          name
        }
        subtotal
        tax
        shipping
        total
        balance
        depositRequired
        depositPaid
      }
      errors {
        message
        path
      }
    }
  }
`;

const DELETE_QUOTE = `
  mutation DeleteQuote($id: ID!) {
    quoteDelete(id: $id) {
      success
      errors {
        message
        path
      }
    }
  }
`;

/**
 * Fetch a quote by ID
 * @param {string} quoteId - The quote ID
 * @returns {Promise<Object>} The quote data
 */
async function getQuote(quoteId) {
  log(LOG_LEVELS.INFO, 'Fetching quote', { quoteId });
  
  try {
    // Wait for client initialization
    await clientPromise;
    
    const data = await executeGraphQL(GET_QUOTE, { id: quoteId });
    if (!data?.quote) {
      throw new PrintavoAPIError(
        'Quote not found',
        'NOT_FOUND_ERROR',
        { id: quoteId }
      );
    }
    return data.quote;
  } catch (error) {
    if (error instanceof PrintavoAPIError) {
      throw error;
    }
    throw new PrintavoAPIError(
      'Failed to fetch quote',
      'FETCH_ERROR',
      { originalError: error.message }
    );
  }
}

/**
 * Fetch recent quotes with pagination and sorting
 * @param {Object} options Query options
 * @param {number} options.first - Number of quotes to fetch (max 25)
 * @param {string} options.after - Cursor for pagination
 * @param {Array<string>} options.statusIds - Filter by status IDs
 * @param {string} options.inProductionAfter - Filter by production start date
 * @param {string} options.inProductionBefore - Filter by production end date
 * @param {string} options.paymentStatus - Filter by payment status
 * @param {string} options.sortOn - Field to sort on
 * @param {boolean} options.sortDescending - Sort direction
 * @param {string} options.searchTerm - Search term for filtering
 * @param {Array<string>} options.tags - Filter by tags
 * @returns {Promise<Object>} The quotes data with pagination info
 */
async function getRecentQuotes(options = {}) {
  const {
    first = 25,
    after = null,
    statusIds = null,
    inProductionAfter = null,
    inProductionBefore = null,
    paymentStatus = null,
    sortOn = 'CREATED_AT',
    sortDescending = true,
    searchTerm = null,
    tags = null
  } = options;

  log(LOG_LEVELS.INFO, 'Fetching recent quotes', {
    first,
    after,
    statusIds,
    paymentStatus,
    sortOn
  });

  try {
    // Wait for client initialization
    await clientPromise;
    
    const data = await executeGraphQL(GET_RECENT_QUOTES, {
      first: Math.min(first, 25),
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

    if (!data?.quotes) {
      throw new PrintavoAPIError(
        'No quotes data returned',
        'FETCH_ERROR'
      );
    }

    return data.quotes;
  } catch (error) {
    throw new PrintavoAPIError(
      'Failed to fetch recent quotes',
      'FETCH_ERROR',
      { originalError: error.message }
    );
  }
}

/**
 * Get size distribution based on product type and distribution name
 * @param {Object} product Product information
 * @param {string} distributionName Name of the distribution to use
 * @param {number} totalQuantity Total quantity to distribute
 * @returns {Object} Size distribution
 */
function getSizeDistribution(product, distributionName, totalQuantity) {
  // If specific distribution provided, use that
  if (distributionName && SIZE_DISTRIBUTIONS[distributionName]) {
    const distribution = SIZE_DISTRIBUTIONS[distributionName];
    const total = Object.values(distribution).reduce((sum, qty) => sum + qty, 0);
    
    // Scale the distribution to match total quantity
    return Object.fromEntries(
      Object.entries(distribution).map(([size, qty]) => [
        size,
        Math.round((qty / total) * totalQuantity)
      ])
    );
  }

  // Try to determine product type and use its default
  const productType = Object.entries(PRODUCT_DEFAULTS).find(([_, defaults]) =>
    product.name.toLowerCase().includes(_.toLowerCase())
  );

  if (productType) {
    const [_, defaults] = productType;
    return getSizeDistribution(product, defaults.defaultSizing, totalQuantity);
  }

  // Fallback to standard retail distribution
  return getSizeDistribution(product, 'STANDARD_RETAIL', totalQuantity);
}

/**
 * Get suggested imprint locations for a product
 * @param {Object} product Product information
 * @returns {Array} Suggested imprint locations
 */
function getSuggestedImprints(product) {
  // Try to determine product type
  const productType = Object.entries(PRODUCT_DEFAULTS).find(([_, defaults]) =>
    product.name.toLowerCase().includes(_.toLowerCase())
  );

  if (productType) {
    const [_, defaults] = productType;
    return defaults.commonLocations.map(location => ({
      name: location,
      ...IMPRINT_LOCATIONS[location]
    }));
  }

  // Fallback to basic front/back locations
  return ['Front Center', 'Back Center'].map(location => ({
    name: location,
    ...IMPRINT_LOCATIONS[location]
  }));
}

/**
 * Expand size distribution into individual line items
 * @param {Object} item Line item with size distribution
 * @returns {Array} Array of line items with individual sizes
 */
function expandSizeDistribution(item) {
  // If no sizeDistribution provided, return item as is
  if (!item.sizeDistribution && !item.standardSizing && !item.totalQuantity) {
    return [item];
  }

  let distribution;
  if (item.sizeDistribution) {
    distribution = item.sizeDistribution;
  } else if (item.totalQuantity) {
    // Will be populated after product lookup
    distribution = null;
  } else {
    return [item];
  }

  const items = [];
  if (distribution) {
    const sizes = Object.entries(distribution);
    
    // Create individual line items for each size
    for (const [size, quantity] of sizes) {
      if (quantity > 0) {
        items.push({
          ...item,
          size,
          quantity,
          sizeDistribution: undefined,
          standardSizing: undefined,
          totalQuantity: undefined
        });
      }
    }
  } else {
    // Keep the item but mark it for distribution after product lookup
    items.push({
      ...item,
      pendingDistribution: true
    });
  }

  return items;
}

/**
 * Calculate required deposit based on quote total
 * @param {Array} lineItems Enhanced line items with prices
 * @param {Object} contact Contact information for customer history
 * @returns {number} Recommended deposit amount
 */
async function calculateDepositRequired(lineItems, contact) {
  // Calculate subtotal from line items
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  // Base deposit percentage on order size
  let depositPercentage = 0;
  if (subtotal <= 500) {
    depositPercentage = 0.5; // 50% for small orders
  } else if (subtotal <= 2000) {
    depositPercentage = 0.35; // 35% for medium orders
  } else {
    depositPercentage = 0.25; // 25% for large orders
  }

  // Round up to nearest $10
  const deposit = Math.ceil((subtotal * depositPercentage) / 10) * 10;

  log(LOG_LEVELS.INFO, 'Calculated deposit', {
    subtotal,
    depositPercentage,
    deposit
  });

  return deposit;
}

/**
 * Enhance line items with product lookups and defaults
 * @param {Array} lineItems Raw line items with product name/sku
 * @returns {Promise<Array>} Enhanced line items with product IDs and defaults
 */
async function enhanceLineItems(lineItems) {
  const enhanced = [];
  
  for (const item of lineItems) {
    // Handle size distribution first
    const expandedItems = expandSizeDistribution(item);
    
    for (const expandedItem of expandedItems) {
      // Skip if we already have product ID
      if (expandedItem.productId) {
        enhanced.push(expandedItem);
        continue;
      }

      // Look up product by SKU or name
      const productResult = await executeGraphQL(SEARCH_PRODUCT, {
        sku: expandedItem.sku,
        name: expandedItem.productName
      });

      const product = productResult?.products?.nodes?.[0];
      if (!product) {
        throw new PrintavoValidationError(
          'Product not found',
          { productInfo: { sku: expandedItem.sku, name: expandedItem.productName } }
        );
      }

      // Handle pending distribution now that we have product info
      let itemsToAdd = [];
      if (expandedItem.pendingDistribution) {
        const distribution = getSizeDistribution(
          product,
          expandedItem.standardSizing,
          expandedItem.totalQuantity
        );

        // Create items for each size
        for (const [size, quantity] of Object.entries(distribution)) {
          if (quantity > 0) {
            itemsToAdd.push({
              ...expandedItem,
              size,
              quantity,
              pendingDistribution: undefined,
              standardSizing: undefined,
              totalQuantity: undefined
            });
          }
        }
      } else {
        itemsToAdd = [expandedItem];
      }

      // Add product info and defaults to each item
      for (const item of itemsToAdd) {
        const enhancedItem = {
          ...item,
          productId: product.id,
          price: item.price || product.defaultPrice,
          markup: item.markup || product.defaultMarkup
        };

        // Add suggested imprints if none provided
        if (!enhancedItem.imprints || enhancedItem.imprints.length === 0) {
          enhancedItem.imprints = getSuggestedImprints(product);
        }

        enhanced.push(enhancedItem);

        log(LOG_LEVELS.INFO, 'Enhanced product line item', {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          size: enhancedItem.size,
          quantity: enhancedItem.quantity
        });
      }
    }
  }

  return enhanced;
}

/**
 * Get smart defaults based on contact history
 * @param {string} contactId Contact ID
 * @returns {Promise<Object>} Default values for quote
 */
async function getSmartDefaults(contactId) {
  const historyResult = await executeGraphQL(GET_CONTACT_HISTORY, { contactId });
  const recentOrder = historyResult?.contact?.recentOrders?.nodes?.[0];

  if (!recentOrder) {
    return {};
  }

  return {
    shippingAddress: recentOrder.shippingAddress,
    paymentTerms: recentOrder.paymentTerms,
    deliveryMethod: recentOrder.deliveryMethod
  };
}

/**
 * Create a new quote
 * @param {Object} quoteData - The quote data
 * @returns {Promise<Object>} The created quote
 */
async function createQuote(quoteData) {
  log(LOG_LEVELS.INFO, 'Creating quote', {
    contactInfo: quoteData.contact || { id: quoteData.contactId },
    lineItemsCount: quoteData.lineItems?.length
  });
  
  try {
    // Wait for client initialization
    await clientPromise;
    
    // Validate input data
    validateQuoteInput(quoteData);
    
    // If we don't have contactId, look up the contact
    let contactId = quoteData.contactId;
    if (!contactId && quoteData.contact) {
      const contactResult = await executeGraphQL(SEARCH_CONTACT, {
        email: quoteData.contact.email,
        fullName: quoteData.contact.fullName
      });
      
      const contact = contactResult?.contacts?.nodes?.[0];
      if (!contact) {
        throw new PrintavoValidationError(
          'Contact not found. Please create the contact first.',
          { contactInfo: quoteData.contact }
        );
      }
      contactId = contact.id;
      
      log(LOG_LEVELS.INFO, 'Found contact', { 
        contactId,
        email: contact.email,
        fullName: contact.fullName
      });
    }

    // Enhance line items with product lookups and size distribution
    const enhancedLineItems = await enhanceLineItems(quoteData.lineItems);

    // Get smart defaults from contact history
    const defaults = await getSmartDefaults(contactId);

    // Calculate deposit if not specified
    const depositRequired = quoteData.depositRequired ?? 
      await calculateDepositRequired(enhancedLineItems, defaults);
    
    // Prepare input data
    const input = {
      contact: { id: contactId },
      customerDueAt: quoteData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      lineItemGroups: [{
        lineItems: enhancedLineItems.map(item => ({
          product: { id: item.productId },
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price,
          markup: item.markup,
          imprints: item.imprints?.map(imp => ({
            name: imp.name,
            description: imp.description,
            location: imp.location,
            colors: imp.colors
          }))
        }))
      }],
      shippingAddress: quoteData.shippingAddress || defaults.shippingAddress,
      billingAddress: quoteData.billingAddress,
      customerNote: quoteData.customerNote,
      productionNote: quoteData.productionNote,
      internalNote: quoteData.internalNote,
      tags: quoteData.tags,
      status: quoteData.statusId ? { id: quoteData.statusId } : undefined,
      paymentTerms: quoteData.paymentTermsId ? 
        { id: quoteData.paymentTermsId } : 
        defaults.paymentTerms,
      deliveryMethod: quoteData.deliveryMethodId ? 
        { id: quoteData.deliveryMethodId } : 
        defaults.deliveryMethod,
      depositRequired
    };
    
    const data = await executeGraphQL(CREATE_QUOTE, { input });
    const response = data.quoteCreate;
    
    if (response.errors?.length > 0) {
      throw new PrintavoValidationError(
        'Quote creation failed',
        { errors: response.errors }
      );
    }
    
    return response.quote;
  } catch (error) {
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
    throw new PrintavoAPIError(
      'Failed to create quote',
      'CREATE_ERROR',
      { originalError: error.message }
    );
  }
}

/**
 * Update an existing quote
 * @param {string} id Quote ID
 * @param {Object} updateData Update data
 * @returns {Promise<Object>} Updated quote
 */
async function updateQuote(id, updateData) {
  log(LOG_LEVELS.INFO, 'Updating quote', { id });
  
  try {
    // Wait for client initialization
    await clientPromise;
    
    const data = await executeGraphQL(UPDATE_QUOTE, {
      id,
      input: updateData
    });
    
    const response = data.quoteUpdate;
    if (response.errors?.length > 0) {
      throw new PrintavoValidationError(
        'Quote update failed',
        { errors: response.errors }
      );
    }
    
    return response.quote;
  } catch (error) {
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
    throw new PrintavoAPIError(
      'Failed to update quote',
      'UPDATE_ERROR',
      { originalError: error.message }
    );
  }
}

/**
 * Delete a quote
 * @param {string} id Quote ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteQuote(id) {
  log(LOG_LEVELS.INFO, 'Deleting quote', { id });
  
  try {
    // Wait for client initialization
    await clientPromise;
    
    const data = await executeGraphQL(DELETE_QUOTE, { id });
    
    const response = data.quoteDelete;
    if (response.errors?.length > 0) {
      throw new PrintavoValidationError(
        'Quote deletion failed',
        { errors: response.errors }
      );
    }
    
    return response.success;
  } catch (error) {
    if (error instanceof PrintavoValidationError) {
      throw error;
    }
    throw new PrintavoAPIError(
      'Failed to delete quote',
      'DELETE_ERROR',
      { originalError: error.message }
    );
  }
}

module.exports = {
  getQuote,
  getRecentQuotes,
  createQuote,
  updateQuote,
  deleteQuote
}; 