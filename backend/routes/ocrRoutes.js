const express = require('express');
const multer = require('multer');
const ocrService = require('../services/ocrService');
const { uploadMiddleware } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/upload-invoice', uploadMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    const result = await ocrService.processInvoice(req.file);
    res.json(result);
  } catch (error) {
    // Error handling
  }
});

module.exports = router; 