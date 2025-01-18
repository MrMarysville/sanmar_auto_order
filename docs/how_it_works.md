# How It Works

## Core Functionality

### 1. OCR Invoice Processing

The OCR processing pipeline consists of several steps:

1. **PDF Handling**
   ```javascript
   // Convert PDF pages to images
   async function convertPDFToImages(pdfPath) {
     // Returns array of image paths for each page
   }
   ```

2. **Text Extraction**
   - Uses Tesseract.js for OCR processing
   - Processes each page image separately
   - Combines results from all pages

3. **Data Parsing**
   - Extracts structured data from OCR text
   - Identifies line items, quantities, and prices
   - Maps extracted data to Printavo format

### 2. Printavo Integration

The Printavo service handles all interactions with the Printavo GraphQL API:

1. **Client Initialization**
   ```javascript
   // Initialize GraphQL client with authentication
   const client = new GraphQLClient(process.env.PRINTAVO_API_URL, {
     headers: {
       'Content-Type': 'application/json',
       'email': process.env.PRINTAVO_EMAIL,
       'token': process.env.PRINTAVO_ACCESS_TOKEN
     }
   });
   ```

2. **GraphQL Operations**
   - Query operations for fetching data
   - Mutation operations for creating/updating orders
   - Pagination handling for large result sets

3. **Rate Limiting**
   - Implements retry logic with exponential backoff
   - Respects Printavo's rate limits (10 requests per 5 seconds)
   - Queues requests when approaching limits

### 3. Data Validation

Comprehensive validation is implemented using Zod schemas:

1. **Schema Definitions**
   ```javascript
   const addressSchema = z.object({
     address1: z.string().min(1).max(255),
     city: z.string().min(1).max(255),
     stateIso: z.string().length(2),
     // ... more fields
   });

   const lineItemSchema = z.object({
     productId: z.string(),
     quantity: z.number().int().positive(),
     // ... more fields
   });
   ```

2. **Validation Process**
   - Schema validation for data structure
   - Business rule validation for data values
   - Custom validation for specific fields

3. **Error Handling**
   - Detailed error messages for validation failures
   - Error aggregation for multiple issues
   - Error classification by type

### 4. Error Handling

The error handling system uses custom error classes:

1. **Error Classes**
   ```javascript
   class PrintavoAPIError extends Error {
     constructor(message, code, details = {}) {
       super(message);
       this.name = 'PrintavoAPIError';
       this.code = code;
       this.details = details;
     }
   }
   ```

2. **Error Types**
   - Validation errors
   - Authentication errors
   - API errors
   - Network errors

3. **Retry Logic**
   - Automatic retries for transient failures
   - Configurable retry attempts and delays
   - Different strategies based on error type

### 5. Logging System

Comprehensive logging is implemented throughout:

1. **Log Structure**
   ```javascript
   const log = (level, message, data = {}) => {
     const logEntry = {
       timestamp: new Date().toISOString(),
       level,
       message,
       requestId: randomUUID(),
       ...data
     };
     // ... logging logic
   };
   ```

2. **Log Levels**
   - ERROR: Critical issues
   - WARN: Important but non-critical issues
   - INFO: General operational information
   - DEBUG: Detailed debugging information

3. **Security Features**
   - Sensitive data masking
   - Request ID tracking
   - Error stack traces in development

## Important Algorithms

### 1. Rate Limiting Algorithm
```javascript
async function executeGraphQL(query, variables, options = { maxRetries: 3, retryDelay: 1000 }) {
  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      return await client.request(query, variables);
    } catch (error) {
      if (error.response?.status === 429) {
        const retryDelay = options.retryDelay * attempt;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      throw error;
    }
  }
}
```

### 2. Validation Algorithm
```javascript
function validateInvoiceInput(invoiceData) {
  // Schema validation
  const validationResult = invoiceSchema.safeParse(invoiceData);
  if (!validationResult.success) {
    throw new PrintavoValidationError('Validation failed', validationResult.error);
  }

  // Business rule validation
  validateBusinessRules(validationResult.data);
}
```

## Data Structures

### 1. Invoice Data Structure
```javascript
{
  id: string,
  visualId: string,
  status: {
    id: string,
    name: string
  },
  contact: {
    id: string,
    fullName: string,
    email: string
  },
  lineItemGroups: {
    nodes: [{
      id: string,
      lineItems: {
        nodes: [{
          id: string,
          product: {
            id: string,
            itemNumber: string,
            description: string
          },
          items: number,
          price: number,
          size: string,
          color: string
        }]
      }
    }]
  },
  shippingAddress: {
    address1: string,
    city: string,
    stateIso: string,
    zipCode: string,
    // ... more fields
  }
} 