import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { connectDB } from './db.js';
import indexRouter from './routes/index.js';
import ocrRoutes from './routes/ocrRoutes.js';
import printavoRoutes from './routes/printavoRoutes.js';

const app = express();

// Log environment variables (excluding sensitive data)
const safeEnvVars = { ...process.env };
delete safeEnvVars.PRINTAVO_ACCESS_TOKEN;
delete safeEnvVars.SANMAR_PASSWORD;
console.log('Environment variables:', safeEnvVars);

// Check MongoDB connection string
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not set.');
  process.exit(1);
}

// Connect to MongoDB
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', indexRouter);
app.use('/api/ocr', ocrRoutes);
app.use('/api/printavo', printavoRoutes);

// Basic test route
app.get('/', (req, res) => {
  res.send('SanMar Integration Service is running.');
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not Found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  // Handle specific error types
  if (err.name === 'PrintavoAPIError') {
    return res.status(err.code === 'AUTHENTICATION_ERROR' ? 401 : 500).json({
      success: false,
      error: err.message,
      code: err.code
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.details || err.message
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred'
      : err.message || 'Something broke!'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app; // For testing purposes 