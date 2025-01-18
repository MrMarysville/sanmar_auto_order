# Data Models

## Core Data Models

### 1. Invoice Model
**Purpose**: Represents a complete order in the Printavo system
**Fields**:
```javascript
{
  id: "Unique identifier for the invoice",
  visualId: "Human-readable invoice number",
  status: {
    id: "Status identifier (e.g., 'new', 'in_production')",
    name: "Human-readable status name"
  },
  contact: {
    id: "Unique identifier for the contact",
    fullName: "Contact's full name",
    email: "Contact's email address (optional)"
  },
  lineItemGroups: {
    nodes: [/* Array of line item groups */]
  },
  shippingAddress: {
    address1: "Street address",
    address2: "Additional address info (optional)",
    city: "City name",
    stateIso: "Two-letter state code",
    zipCode: "Postal code",
    country: "Country code (default: US)",
    phone: "Phone number (optional)",
    email: "Email address (optional)"
  }
}
```

### 2. Line Item Model
**Purpose**: Represents a single product item in an order
**Fields**:
```javascript
{
  id: "Unique identifier for the line item",
  product: {
    id: "Product identifier",
    itemNumber: "Product SKU or number",
    description: "Product description"
  },
  items: "Quantity ordered",
  price: "Price per item",
  size: "Product size",
  color: "Product color"
}
```

### 3. Contact Model
**Purpose**: Represents a customer or contact in the system
**Fields**:
```javascript
{
  id: "Unique identifier for the contact",
  fullName: "Contact's full name",
  email: "Contact's email address",
  phone: "Contact's phone number (optional)",
  company: "Company name (optional)"
}
```

## Validation Constants

### Address Validation
```javascript
const VALIDATION_CONSTANTS = {
  VALID_STATE_CODES: [
    'AL', 'AK', 'AZ', /* ... all US state codes ... */
  ],
  VALID_COUNTRIES: ['US', 'USA', 'CA', 'CAN'],
  ZIP_CODE_PATTERNS: {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/
  }
};
```

### Product Validation
```javascript
const VALIDATION_CONSTANTS = {
  MAX_LINE_ITEMS: 100,
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 10000,
  MAX_PRICE: 1000000,
  PRODUCT_ID_PATTERN: /^[A-Za-z0-9-_]+$/,
  COLOR_PATTERN: /^[A-Za-z0-9\s-]+$/,
  SIZE_PATTERN: /^[A-Za-z0-9XSMLxsml\s-]+$/
};
```

## GraphQL Types

### Query Types
```graphql
type Query {
  invoice(id: ID!): Invoice
  invoices(first: Int!, after: String): InvoiceConnection
  contacts(filter: ContactFilter, first: Int): ContactConnection
  account: Account
}
```

### Mutation Types
```graphql
type Mutation {
  invoiceCreate(input: InvoiceCreateInput!): InvoiceCreatePayload
}
```

### Connection Types
```graphql
type InvoiceConnection {
  nodes: [Invoice]
  pageInfo: PageInfo
  totalCount: Int
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}
```

## Error Types

### API Errors
```javascript
class PrintavoAPIError {
  name: "Name of the error",
  message: "Error message",
  code: "Error code (e.g., 'VALIDATION_ERROR')",
  details: {
    // Additional error details
  }
}
```

### Validation Errors
```javascript
class PrintavoValidationError {
  name: "PrintavoValidationError",
  message: "Validation error message",
  errors: [
    {
      field: "Field that failed validation",
      message: "Specific validation error message"
    }
  ]
}
```

## Data Flow Types

### OCR Result
```javascript
type OCRResult = {
  text: string,          // Raw extracted text
  confidence: number,    // OCR confidence score
  pageNumber: number,    // Page number in PDF
  bounds: {             // Text location in image
    left: number,
    top: number,
    width: number,
    height: number
  }
}
```

### Parsed Invoice Data
```javascript
type ParsedInvoiceData = {
  orderNumber: string,
  items: Array<{
    productId: string,
    quantity: number,
    price: number,
    size: string,
    color: string
  }>,
  customer: {
    name: string,
    email: string,
    address: {
      // Address fields
    }
  }
} 