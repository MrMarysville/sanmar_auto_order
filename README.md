# SanMar Integration Service

This service integrates Printavo invoice data with SanMar's SOAP API for automated order processing.

## Features

- Process Printavo invoices (via OCR or direct input)
- Map invoice data to SanMar's required fields
- Check inventory availability
- Submit purchase orders to SanMar
- Error handling and logging

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Copy `.env.example` to `.env`
- Update the following variables:
  - `SANMAR_USERNAME`: Your SanMar API username
  - `SANMAR_PASSWORD`: Your SanMar API password
  - `SANMAR_WSDL_URL`: SanMar WSDL URL
  - `PORT`: Application port (default: 3000)
  - `MONGODB_URI`: MongoDB connection string

3. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

- `GET /health`: Health check endpoint
- `POST /api/invoice`: Process Printavo invoice
- `POST /api/order`: Submit order to SanMar
- `GET /api/inventory/:style/:color`: Check inventory availability

## Development

The project structure is organized as follows:
```
sanmar-integration/
├── app.js              # Application entry point
├── routes/             # API routes
├── controllers/        # Route controllers
├── services/          # Business logic
└── tests/             # Test files
```

## License

ISC 