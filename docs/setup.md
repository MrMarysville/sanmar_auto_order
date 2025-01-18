# Setup and Installation

## Prerequisites

### Required Software
- Node.js (v18.x or later)
- npm (v9.x or later)
- Git

### System Requirements
- Operating System: Windows, macOS, or Linux
- Memory: Minimum 4GB RAM (8GB recommended)
- Storage: At least 1GB free space

## Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/sanmar-auto-order.git
   cd sanmar-auto-order
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   # Printavo API Configuration
   PRINTAVO_API_URL=https://www.printavo.com/api/v2
   PRINTAVO_EMAIL=your-email@example.com
   PRINTAVO_ACCESS_TOKEN=your-api-token

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # MongoDB Configuration (if using database)
   MONGODB_URI=mongodb://localhost:27017/sanmar_auto_order
   ```

4. **Verify Installation**
   ```bash
   npm run test
   ```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PRINTAVO_API_URL` | Printavo API endpoint | Yes | - |
| `PRINTAVO_EMAIL` | Printavo account email | Yes | - |
| `PRINTAVO_ACCESS_TOKEN` | Printavo API token | Yes | - |
| `PORT` | Server port number | No | 3000 |
| `NODE_ENV` | Environment mode | No | development |
| `MONGODB_URI` | MongoDB connection string | No | - |

### API Rate Limits

The Printavo API has the following rate limits:
- Maximum 10 requests per 5 seconds
- Per user email or IP address

### Security Configuration

1. **API Token**
   - Obtain from Printavo's My Account page
   - Store securely in environment variables
   - Never commit tokens to version control

2. **CORS Configuration**
   ```javascript
   // Update in app.js if needed
   app.use(cors({
     origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
   }));
   ```

## Development Setup

1. **Install Development Dependencies**
   ```bash
   npm install --save-dev nodemon
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Enable Debug Logging**
   ```bash
   DEBUG=printavo:* npm run dev
   ```

## Production Deployment

1. **Environment Setup**
   ```bash
   # Set production environment
   export NODE_ENV=production
   ```

2. **Security Checklist**
   - [ ] Set secure environment variables
   - [ ] Configure proper CORS settings
   - [ ] Enable rate limiting
   - [ ] Set up error logging
   - [ ] Configure SSL/TLS

3. **Start Production Server**
   ```bash
   npm start
   ```

## Troubleshooting

### Common Issues

1. **API Authentication Errors**
   ```
   Error: Failed to authenticate with Printavo API
   ```
   - Verify email and token in `.env`
   - Check API URL format
   - Ensure account has API access

2. **OCR Processing Issues**
   ```
   Error: Failed to process PDF
   ```
   - Check PDF file permissions
   - Verify Tesseract.js installation
   - Ensure sufficient memory

3. **Rate Limiting**
   ```
   Error: Too many requests
   ```
   - Check request frequency
   - Implement request queuing
   - Add delay between requests

### Debug Mode

Enable detailed logging:
```bash
# Windows
set DEBUG=printavo:*
# Unix
export DEBUG=printavo:*
```

### Support

For additional support:
1. Check the [GitHub Issues](https://github.com/your-org/sanmar-auto-order/issues)
2. Review the [API Documentation](https://www.printavo.com/api/v2/docs)
3. Contact [support@example.com](mailto:support@example.com) 