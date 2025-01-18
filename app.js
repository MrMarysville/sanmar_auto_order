require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./db');
const indexRouter = require('./routes/index');

const app = express();

// Connect to MongoDB
connectDB().catch(console.error);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', indexRouter);

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
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Something broke!'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

module.exports = app; // For testing purposes 