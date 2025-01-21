# Backend Service Documentation

## API Integration & Validation

The backend implements robust validation and error handling for both Printavo's GraphQL API and SanMar's SOAP API services.

### Environment Configuration

Required environment variables are documented in `.env.example`. Copy this file to `.env` and configure:

```bash
cp .env.example .env
```

### Testing Connections

Use the connection test script to verify your API configurations:

```bash
node tests/testConnections.js
```

### Error Handling

The system implements comprehensive error handling with specific error types:

- `PrintavoAPIError`: For Printavo API-related errors
- `PrintavoValidationError`: For input validation errors
- `PrintavoAuthenticationError`: For authentication issues
- `SanMarAPIError`: For SanMar API-related errors

### Retry Logic

Both GraphQL and SOAP clients implement exponential backoff retry logic for transient failures:

- Maximum retries: 3 attempts
- Initial delay: 1 second
- Maximum delay: 5 seconds
- Jitter: Random delay added to prevent thundering herd

### Request Timeouts

Default timeout configuration:
- API requests: 30 seconds
- Can be configured via environment variables

### Validation Features

#### Printavo GraphQL
- Environment variable validation
- GraphQL query/mutation structural validation
- Response structure validation
- Authentication token format validation
- Email format validation
- URL format validation

#### SanMar SOAP
- WSDL URL validation
- Credential validation
- WS-Security implementation
- Line item validation:
  - Array structure
  - Required fields
  - Data types
  - Value ranges
- Shipping information validation:
  - Required fields
  - Address format
  - ZIP code format
  - State code format

### Error Classification

Errors are classified into categories with specific codes:

```javascript
ERROR_CODES = {
  VALIDATION: {
    INVALID_INPUT: 'INVALID_INPUT',
    REQUIRED_FIELD: 'REQUIRED_FIELD',
    INVALID_FORMAT: 'INVALID_FORMAT'
  },
  API: {
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    RATE_LIMITED: 'RATE_LIMITED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
  },
  DATA: {
    NOT_FOUND: 'DATA_NOT_FOUND',
    ALREADY_EXISTS: 'DATA_ALREADY_EXISTS',
    INVALID_STATE: 'INVALID_STATE'
  },
  SYSTEM: {
    CONFIGURATION: 'CONFIGURATION_ERROR',
    DEPENDENCY: 'DEPENDENCY_ERROR',
    NETWORK: 'NETWORK_ERROR'
  }
}
```

### Logging

Comprehensive logging is implemented for debugging and monitoring:

- Request/response logging
- Error logging with stack traces in development
- Retry attempt logging
- Connection status logging

### Example Usage

#### Printavo GraphQL Example

```javascript
const printavoService = require('./services/printavoService');

try {
  // Get account details
  const account = await printavoService.account.getAccount();
  
  // Create an invoice
  const invoice = await printavoService.invoices.createInvoice({
    customer: { id: 'customer_id' },
    lineItems: [
      { 
        product: 'T-Shirt',
        quantity: 100
      }
    ]
  });
} catch (error) {
  if (error instanceof PrintavoValidationError) {
    console.error('Validation failed:', error.metadata.validationErrors);
  } else if (error instanceof PrintavoAuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else {
    console.error('API error:', error.message);
  }
}
```

#### SanMar SOAP Example

```javascript
const { submitPO } = require('./services/sanmarService');

try {
  const order = await submitPO({
    poNumber: 'PO123',
    shipToName: 'John Doe',
    shipToAddress1: '123 Main St',
    shipToCity: 'Springfield',
    shipToState: 'IL',
    shipToZip: '62701',
    lineItems: [
      {
        inventoryKey: 'PC61',
        quantity: 24,
        sizeIndex: 4
      }
    ]
  });
} catch (error) {
  if (error.code === ERROR_CODES.VALIDATION.INVALID_INPUT) {
    console.error('Invalid input:', error.metadata);
  } else if (error.code === ERROR_CODES.API.SERVICE_UNAVAILABLE) {
    console.error('Service unavailable:', error.message);
  } else {
    console.error('Error submitting PO:', error.message);
  }
}
```

## Development

### Adding New Features

When adding new API integrations:

1. Add environment variables to `.env.example`
2. Implement validation in `utils/envValidation.js`
3. Add error types if needed in `utils/errorHandling.js`
4. Create service with proper error handling and validation
5. Add test cases in `tests/` directory

### Testing

Run the connection test script to verify API connectivity:

```bash
node tests/testConnections.js
```

### Debugging

Set `NODE_ENV=development` for detailed error information including stack traces.

Enable debug logging by setting `LOG_LEVEL=debug` in your environment variables.
