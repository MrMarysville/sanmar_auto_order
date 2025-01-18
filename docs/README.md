# SanMar Auto Order Integration

## Project Overview
This project provides an automated integration between SanMar's SOAP API and Printavo's GraphQL API for streamlined order processing in the apparel printing industry. It automates the process of extracting order information from SanMar invoices using OCR technology and creating corresponding orders in Printavo's system.

## Key Features
- **OCR Invoice Processing**: Automatically extracts data from SanMar PDF invoices using Tesseract OCR
- **Multi-Page PDF Support**: Handles multi-page PDF documents, combining OCR results from all pages
- **Printavo Integration**: Creates and manages orders in Printavo using their GraphQL API
- **Data Validation**: Comprehensive validation of all data before submission to Printavo
- **Error Handling**: Robust error handling with retries for API rate limits and network issues
- **Logging**: Detailed logging system with request tracking and sensitive data masking

## Target Audience
This project is designed for:
- Screen printing and embroidery shops using Printavo for order management
- Businesses that regularly order from SanMar and need automated order processing
- Developers integrating SanMar and Printavo systems

## Example Use Cases

1. **Automated Order Creation**
   ```
   A print shop receives a SanMar invoice PDF. They upload it to the system, which automatically extracts the order details and creates a new order in Printavo with all the correct line items, quantities, and customer information.
   ```

2. **Bulk Invoice Processing**
   ```
   A large print shop receives multiple SanMar invoices daily. They can process all invoices at once, with the system handling the OCR extraction and Printavo order creation for each invoice automatically.
   ```

3. **Order Validation**
   ```
   Before creating orders in Printavo, the system validates all extracted data, ensuring accurate information transfer and preventing errors in the order process.
   ```

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Printavo and SanMar credentials
   ```

3. Start the service:
   ```bash
   npm start
   ```

4. Access the API at `http://localhost:3000` 