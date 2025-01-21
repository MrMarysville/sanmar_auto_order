# Printavo GraphQL Operations Documentation

This document provides comprehensive documentation for key Printavo GraphQL operations including connection verification, invoice creation, and invoice searching.

## Table of Contents
- [Verify Connection](#verify-connection)
- [Create Invoice](#create-invoice)
- [Search Invoices](#search-invoices)

## Verify Connection

The `verifyConnection` operation allows you to test the connection to the Printavo API and validate your authentication credentials.

### Usage

```javascript
const printavoService = require('../services/printavoService');

try {
  const isConnected = await printavoService.account.verifyConnection();
  if (isConnected) {
    console.log('Successfully connected to Printavo API');
  }
} catch (error) {
  console.error('Connection verification failed:', error.message);
}
```

### Response

Returns a boolean indicating whether the connection was successful.

### Error Handling

- `PrintavoAuthenticationError`: Thrown when authentication credentials are invalid
- `PrintavoAPIError`: Thrown when the API request fails for other reasons

## Create Invoice

The `createInvoice` operation allows you to create a new invoice in Printavo with line items, contact information, and other details.

### Input Parameters

```typescript
interface InvoiceCreateInput {
  contactId: string;              // Required: ID of the contact
  dueDate?: string;              // Optional: Due date for the invoice
  lineItems: Array<{
    productId: string;           // Required: Product ID
    quantity: number;            // Required: Quantity
    size: string;               // Required: Size code
    color: string;              // Required: Color code
    price: number;              // Required: Unit price
    imprints?: Array<{         // Optional: Imprint specifications
      name: string;            // Required: Imprint name
      description?: string;    // Optional: Imprint description
      location: string;        // Required: Imprint location
      colors: Array<string>;   // Required: Array of colors
    }>;
  }>;
  shippingAddress?: {           // Optional: Shipping address
    companyName?: string;
    customerName?: string;
    address1: string;
    address2?: string;
    city: string;
    stateIso: string;
    zipCode: string;
    countryIso: string;
  };
  billingAddress?: {            // Optional: Billing address
    // Same structure as shippingAddress
  };
  customerNote?: string;        // Optional: Customer-facing note
  productionNote?: string;      // Optional: Production-specific note
  internalNote?: string;        // Optional: Internal note
  tags?: Array<string>;         // Optional: Array of tags
  statusId?: string;            // Optional: ID of the invoice status
  paymentTermsId?: string;      // Optional: ID of the payment terms
  deliveryMethodId?: string;    // Optional: ID of the delivery method
  depositRequired?: number;     // Optional: Required deposit amount
}
```

### Usage Example

```javascript
const printavoService = require('../services/printavoService');

const invoiceData = {
  contactId: "contact_123",
  lineItems: [{
    productId: "prod_456",
    quantity: 100,
    size: "L",
    color: "Navy",
    price: 15.99,
    imprints: [{
      name: "Front Logo",
      location: "Center Front",
      colors: ["White"]
    }]
  }],
  shippingAddress: {
    companyName: "Acme Corp",
    address1: "123 Main St",
    city: "Springfield",
    stateIso: "IL",
    zipCode: "62701",
    countryIso: "US"
  },
  customerNote: "Please deliver during business hours",
  tags: ["rush", "corporate"]
};

try {
  const newInvoice = await printavoService.invoices.createInvoice(invoiceData);
  console.log('Invoice created:', newInvoice.id);
} catch (error) {
  console.error('Failed to create invoice:', error.message);
}
```

### Response

Returns the created invoice object with all details including:
- Invoice ID and visual ID
- Contact information
- Line items and imprints
- Addresses
- Notes and tags
- Payment information
- Timestamps

### Error Handling

- `PrintavoValidationError`: Thrown when input data is invalid
- `PrintavoAPIError`: Thrown when the API request fails
- Specific error messages will be included in the `errors` array of the response

## Search Invoices

The `getRecentInvoices` operation allows you to search and retrieve invoices based on various criteria.

### Query Parameters

```typescript
interface InvoiceQueryOptions {
  first?: number;              // Optional: Number of invoices to fetch (max 25)
  after?: string;             // Optional: Cursor for pagination
  statusIds?: string[];       // Optional: Filter by status IDs
  inProductionAfter?: string; // Optional: Filter by production start date
  inProductionBefore?: string;// Optional: Filter by production end date
  paymentStatus?: string;     // Optional: Filter by payment status
  sortOn?: string;           // Optional: Field to sort on
  sortDescending?: boolean;   // Optional: Sort direction
  searchTerm?: string;       // Optional: Search term for filtering
  tags?: string[];          // Optional: Filter by tags
}
```

### Usage Example

```javascript
const printavoService = require('../services/printavoService');

const searchOptions = {
  first: 10,
  statusIds: ["status_789"],
  paymentStatus: "PAID",
  sortOn: "createdAt",
  sortDescending: true,
  tags: ["rush"]
};

try {
  const result = await printavoService.invoices.getRecentInvoices(searchOptions);
  console.log('Found invoices:', result.nodes);
  console.log('Pagination info:', result.pageInfo);
  console.log('Total count:', result.totalNodes);
} catch (error) {
  console.error('Failed to search invoices:', error.message);
}
```

### Response

Returns an object containing:
- `nodes`: Array of invoice objects
- `pageInfo`: Pagination information including:
  - `hasNextPage`: Boolean indicating if more results exist
  - `endCursor`: Cursor for fetching next page
- `totalNodes`: Total count of matching invoices

### Error Handling

- `PrintavoValidationError`: Thrown when query parameters are invalid
- `PrintavoAPIError`: Thrown when the API request fails
- Specific error messages will be included in the error object

### Pagination

To implement pagination:

```javascript
async function fetchAllInvoices(searchOptions) {
  let allInvoices = [];
  let hasMore = true;
  let cursor = null;

  while (hasMore) {
    const result = await printavoService.invoices.getRecentInvoices({
      ...searchOptions,
      first: 25,
      after: cursor
    });

    allInvoices = [...allInvoices, ...result.nodes];
    hasMore = result.pageInfo.hasNextPage;
    cursor = result.pageInfo.endCursor;
  }

  return allInvoices;
}
