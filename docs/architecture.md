# Architecture Overview

## High-Level Overview
The SanMar Auto Order Integration is built with a modular architecture consisting of several key components:

1. **API Layer**
   - Express.js server handling HTTP requests
   - Route handlers for file uploads and order processing
   - Middleware for error handling and request validation

2. **OCR Processing**
   - PDF to image conversion using `pdf2img`
   - Text extraction using Tesseract.js
   - Multi-page document handling and result aggregation

3. **Printavo Integration**
   - GraphQL client implementation
   - Request/response validation using Zod
   - Rate limiting and retry handling

4. **Data Validation Layer**
   - Schema validation using Zod
   - Custom validation rules for business logic
   - Error aggregation and reporting

## Data Flow

1. **Input Processing**
   ```
   PDF Invoice → PDF to Image Conversion → OCR Text Extraction → Data Parsing
   ```

2. **Data Validation**
   ```
   Parsed Data → Schema Validation → Business Rule Validation → Error Checking
   ```

3. **Printavo Integration**
   ```
   Validated Data → GraphQL Query/Mutation → Response Validation → Result
   ```

4. **Error Handling**
   ```
   Error Detection → Error Classification → Retry Logic → Error Reporting
   ```

## Key Technologies

### Core Technologies
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **GraphQL**: API integration with Printavo
- **Tesseract.js**: OCR processing

### Libraries and Tools
- **graphql-request**: GraphQL client
- **pdf2img**: PDF processing
- **zod**: Schema validation
- **dotenv**: Environment configuration
- **debug**: Logging and debugging

### Development Tools
- **nodemon**: Development server
- **ESLint**: Code linting
- **Git**: Version control

## Component Diagram (Text Description)

```
[Client]
    ↓ HTTP
[Express Server]
    ↓ File Upload
[OCR Processing]
    | PDF2Image
    | Tesseract
    ↓ Text Data
[Data Parser]
    ↓ Structured Data
[Validation Layer]
    | Zod Schemas
    | Business Rules
    ↓ Validated Data
[Printavo Service]
    | GraphQL Client
    | Rate Limiting
    | Error Handling
    ↓ API Requests
[Printavo API]
```

## Security Considerations
- Environment-based configuration
- Sensitive data masking in logs
- API token management
- Rate limiting protection
- Input validation and sanitization

## Error Handling Strategy
- Custom error classes for different scenarios
- Automatic retry for transient failures
- Detailed error logging with request tracking
- Graceful degradation under load 